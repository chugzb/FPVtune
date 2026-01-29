#!/usr/bin/env python3
"""
本地测试 BBL Decoder 解析逻辑
直接使用 orangebox 库测试，输出 JSON 结构
"""

import json
import math
import struct
from orangebox import Parser

BBL_PATH = '/Users/a1/A1项目/fpv/public/test bll txt/BTFL_BLACKBOX_LOG_20260113_154353_JHEF745V2五寸竞速胶带.BBL'


def calculate_rms(values):
    if not values:
        return 0.0
    squared = [v * v for v in values]
    return math.sqrt(sum(squared) / len(squared))


def parse_bbl_to_json(parser):
    headers = parser.headers
    field_names = parser.field_names
    frames_list = list(parser.frames())
    
    field_idx = {name: i for i, name in enumerate(field_names)}
    
    looptime = int(headers.get('looptime', 125))
    pid_process_denom = int(headers.get('pid_process_denom', 1))
    gyro_sync_denom = int(headers.get('gyro_sync_denom', 1))
    sample_interval_us = looptime * pid_process_denom
    sample_rate = 1_000_000 / sample_interval_us
    
    def parse_pid(pid_str):
        if isinstance(pid_str, list):
            return {'p': pid_str[0], 'i': pid_str[1], 'd': pid_str[2] if len(pid_str) > 2 else 0}
        return {'p': 0, 'i': 0, 'd': 0}
    
    roll_pid = parse_pid(headers.get('rollPID', [0, 0, 0]))
    pitch_pid = parse_pid(headers.get('pitchPID', [0, 0, 0]))
    yaw_pid = parse_pid(headers.get('yawPID', [0, 0, 0]))
    
    ff_weight = headers.get('ff_weight', [0, 0, 0])
    if isinstance(ff_weight, list) and len(ff_weight) >= 3:
        roll_pid['f'] = ff_weight[0]
        pitch_pid['f'] = ff_weight[1]
        yaw_pid['f'] = ff_weight[2]
    
    gyro_lpf_hz = headers.get('gyro_lpf1_dyn_hz', [0, 0])
    dterm_lpf_hz = headers.get('dterm_lpf1_dyn_hz', [0, 0])
    
    gyro_idx = [field_idx.get(f'gyroADC[{i}]', -1) for i in range(3)]
    motor_idx = [field_idx.get(f'motor[{i}]', -1) for i in range(4)]
    setpoint_idx = [field_idx.get(f'setpoint[{i}]', -1) for i in range(4)]
    vbat_idx = field_idx.get('vbatLatest', -1)
    time_idx = field_idx.get('time', -1)
    
    gyro_roll, gyro_pitch, gyro_yaw = [], [], []
    motor_values = [[], [], [], []]
    setpoint_values = [[], [], [], []]
    vbat_values = []
    time_values = []
    
    for frame in frames_list:
        data = frame.data
        if time_idx >= 0:
            time_values.append(int(data[time_idx]))
        if gyro_idx[0] >= 0:
            gyro_roll.append(float(data[gyro_idx[0]]))
        if gyro_idx[1] >= 0:
            gyro_pitch.append(float(data[gyro_idx[1]]))
        if gyro_idx[2] >= 0:
            gyro_yaw.append(float(data[gyro_idx[2]]))
        for m in range(4):
            if motor_idx[m] >= 0:
                motor_values[m].append(float(data[motor_idx[m]]))
        for s in range(4):
            if setpoint_idx[s] >= 0:
                setpoint_values[s].append(float(data[setpoint_idx[s]]))
        if vbat_idx >= 0:
            vbat_values.append(float(data[vbat_idx]))
    
    gyro_rms = {
        'roll': round(calculate_rms(gyro_roll), 2),
        'pitch': round(calculate_rms(gyro_pitch), 2),
        'yaw': round(calculate_rms(gyro_yaw), 2),
    }
    
    motor_output_range = headers.get('motorOutput', [0, 2047])
    motor_max = motor_output_range[1] if isinstance(motor_output_range, list) and len(motor_output_range) >= 2 else 2047
    
    saturation_count = sum(1 for m in range(4) for val in motor_values[m] if val >= motor_max * 0.95)
    total_motor_samples = sum(len(motor_values[m]) for m in range(4))
    saturation_ratio = round(saturation_count / max(total_motor_samples, 1), 4)
    
    motor_avgs = [sum(m) / max(len(m), 1) for m in motor_values]
    avg_all = sum(motor_avgs) / len(motor_avgs) if motor_avgs else 0
    imbalance = max(abs(a - avg_all) / avg_all for a in motor_avgs) if avg_all > 0 else 0
    
    vbat_min = min(vbat_values) if vbat_values else 0
    vbat_sag = (max(vbat_values) - vbat_min) if vbat_values else 0
    
    if frames_list and time_idx >= 0:
        duration_s = (frames_list[-1].data[time_idx] - frames_list[0].data[time_idx]) / 1_000_000
    else:
        duration_s = len(frames_list) * sample_interval_us / 1_000_000
    
    firmware_revision = headers.get('Firmware revision', '')
    firmware_match = firmware_revision.split()
    firmware_version = firmware_match[1] if len(firmware_match) > 1 else 'Unknown'
    
    return {
        'task': 'diagnose',
        'meta': {
            'firmwareVersion': firmware_version,
            'board': headers.get('Board information', '').split()[-1] if headers.get('Board information') else 'Unknown',
            'looptime_us': looptime,
            'pid_process_denom': pid_process_denom,
            'gyro_sync_denom': gyro_sync_denom,
            'log_duration_s': round(duration_s, 1),
            'total_frames': len(frames_list),
        },
        'config': {
            'pid': {'roll': roll_pid, 'pitch': pitch_pid, 'yaw': yaw_pid},
            'filters': {
                'gyro_lpf_hz': gyro_lpf_hz if isinstance(gyro_lpf_hz, list) else [gyro_lpf_hz, gyro_lpf_hz],
                'dyn_notch': {
                    'count': int(headers.get('dyn_notch_count', 0)),
                    'min_hz': int(headers.get('dyn_notch_min_hz', 0)),
                    'max_hz': int(headers.get('dyn_notch_max_hz', 0)),
                    'q': int(headers.get('dyn_notch_q', 0)),
                },
                'dterm_lpf_hz': dterm_lpf_hz if isinstance(dterm_lpf_hz, list) else [dterm_lpf_hz, dterm_lpf_hz],
            },
            'throttle': {
                'min_throttle': int(headers.get('minthrottle', 1000)),
                'max_throttle': int(headers.get('maxthrottle', 2000)),
                'throttle_limit_percent': int(headers.get('throttle_limit_percent', 100)),
                'digital_idle': int(headers.get('dshot_idle_value', 0)),
            },
        },
        'features': {
            'gyro': {'rms': gyro_rms, 'peak_hz': {'roll': 0, 'pitch': 0, 'yaw': 0}},
            'motor': {'saturation_ratio': saturation_ratio, 'imbalance_ratio': round(imbalance, 4)},
            'battery': {'vbat_min': round(vbat_min / 100, 2), 'vbat_sag': round(vbat_sag / 100, 2)},
        },
        'samples': build_samples(time_values, gyro_roll, gyro_pitch, gyro_yaw, 
                                  setpoint_values, motor_values),
    }


def build_samples(time_values, gyro_roll, gyro_pitch, gyro_yaw, setpoint_values, motor_values, max_samples=100):
    """构建采样数据，均匀采样"""
    if not time_values:
        return {'time_ms': [], 'gyro': {}, 'setpoint': {}, 'motor': {}}
    
    total = len(time_values)
    step = max(1, total // max_samples)
    indices = list(range(0, total, step))[:max_samples]
    
    start_time = time_values[0] if time_values else 0
    
    return {
        'time_ms': [int((time_values[i] - start_time) / 1000) for i in indices],
        'gyro': {
            'roll': [round(gyro_roll[i], 1) if i < len(gyro_roll) else 0 for i in indices],
            'pitch': [round(gyro_pitch[i], 1) if i < len(gyro_pitch) else 0 for i in indices],
            'yaw': [round(gyro_yaw[i], 1) if i < len(gyro_yaw) else 0 for i in indices],
        },
        'setpoint': {
            'roll': [round(setpoint_values[0][i], 1) if i < len(setpoint_values[0]) else 0 for i in indices],
            'pitch': [round(setpoint_values[1][i], 1) if i < len(setpoint_values[1]) else 0 for i in indices],
            'yaw': [round(setpoint_values[2][i], 1) if i < len(setpoint_values[2]) else 0 for i in indices],
        },
        'motor': {
            'm1': [round(motor_values[0][i], 0) if i < len(motor_values[0]) else 0 for i in indices],
            'm2': [round(motor_values[1][i], 0) if i < len(motor_values[1]) else 0 for i in indices],
            'm3': [round(motor_values[2][i], 0) if i < len(motor_values[2]) else 0 for i in indices],
            'm4': [round(motor_values[3][i], 0) if i < len(motor_values[3]) else 0 for i in indices],
        },
    }


def main():
    print('=== BBL Decoder Local Test ===\n')

    print('1. Loading BBL file...')
    parser = Parser.load(BBL_PATH)
    print(f'   ✓ File loaded\n')

    print('2. Parsing BBL file...')
    result = parse_bbl_to_json(parser)
    print('   ✓ Parsing complete\n')

    print('3. Result (key fields):')
    print(f'   - Firmware: {result["meta"]["firmwareVersion"]}')
    print(f'   - Board: {result["meta"]["board"]}')
    print(f'   - Duration: {result["meta"]["log_duration_s"]}s')
    print(f'   - Frames: {result["meta"]["total_frames"]}')
    print(f'   - PID Roll: P={result["config"]["pid"]["roll"]["p"]} I={result["config"]["pid"]["roll"]["i"]} D={result["config"]["pid"]["roll"]["d"]} F={result["config"]["pid"]["roll"].get("f", 0)}')
    print(f'   - Gyro RMS: Roll={result["features"]["gyro"]["rms"]["roll"]}')
    print(f'   - Motor Saturation: {result["features"]["motor"]["saturation_ratio"]*100:.2f}%')
    print(f'   - Battery Min: {result["features"]["battery"]["vbat_min"]}V')

    print('\n4. Full JSON output:')
    print(json.dumps(result, indent=2, ensure_ascii=False))

    print('\n=== Test Complete ===')


if __name__ == '__main__':
    main()
