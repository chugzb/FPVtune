"""
BBL (Betaflight Blackbox Log) Decoder Service
输出标准化 JSON 供 AI 分析，payload <= 100K chars
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response
import base64
import json
import math

app = FastAPI()

MAX_PAYLOAD_CHARS = 100000
TARGET_HZ_LIST = [100, 80, 60, 50, 40, 30, 25]


def safe_int(val, default=0):
    if val is None or val == '':
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


def safe_float(val, default=0.0):
    if val is None or val == '':
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def calculate_rms(values):
    if not values:
        return 0.0
    squared = [v * v for v in values]
    return math.sqrt(sum(squared) / len(squared))


def calculate_peak_frequency(values, sample_rate):
    if len(values) < 10:
        return 0.0
    zero_crossings = 0
    for i in range(1, len(values)):
        if (values[i-1] >= 0 and values[i] < 0) or (values[i-1] < 0 and values[i] >= 0):
            zero_crossings += 1
    duration = len(values) / sample_rate
    if duration > 0:
        return zero_crossings / (2 * duration)
    return 0.0


# CLI 字段分类
CLI_A_CORE = {
    'Firmware revision', 'Firmware date', 'Board information', 'Craft name',
    'looptime', 'gyro_sync_denom', 'pid_process_denom',
    'gyro_scale', 'acc_1G', 'vbatscale', 'vbatref',
    'minthrottle', 'maxthrottle', 'motorOutput',
    'motor_output_limit', 'throttle_limit_type', 'throttle_limit_percent',
    'dshot_idle_value', 'dshot_bidir', 'motor_poles',
}

CLI_B_FILTERS = {
    'rollPID', 'pitchPID', 'yawPID',
    'd_max_gain', 'd_max_advance',
    'dterm_lpf1_dyn_hz', 'dterm_lpf2_hz', 'dterm_notch_hz', 'dterm_notch_cutoff',
    'gyro_lpf1_dyn_hz', 'gyro_lowpass2_hz', 'gyro_notch_hz', 'gyro_notch_cutoff',
    'dyn_notch_count', 'dyn_notch_min_hz', 'dyn_notch_max_hz', 'dyn_notch_q',
    'rpm_filter_fade_range_hz', 'ff_weight',
}

CLI_C_CONTROLS = {
    'rc_rates', 'rc_expo', 'rates', 'rate_limits', 'rates_type',
    'deadband', 'yaw_deadband',
    'iterm_relax', 'iterm_relax_type', 'iterm_relax_cutoff',
    'anti_gravity_gain', 'anti_gravity_cutoff_hz', 'anti_gravity_p_gain',
    'abs_control_gain', 'use_integrated_yaw',
}

CLI_D_CONTEXT = {
    'Log start datetime', 'mixer_type', 'acc_lpf_hz', 'acc_hardware', 'baro_hardware',
    'gyro_cal_on_first_arm', 'airmode_activate_throttle', 'serialrx_provider',
    'motor_pwm_rate', 'features', 'fields_disabled_mask', 'blackbox_high_resolution',
    'vbat_sag_compensation',
    'dyn_idle_p_gain', 'dyn_idle_i_gain', 'dyn_idle_d_gain',
    'dyn_idle_max_increase', 'dyn_idle_start_increase',
    'simplified_pids_mode', 'simplified_master_multiplier',
    'simplified_i_gain', 'simplified_d_gain', 'simplified_pi_gain',
    'simplified_feedforward_gain', 'simplified_pitch_d_gain', 'simplified_pitch_pi_gain',
    'simplified_dterm_filter', 'simplified_dterm_filter_multiplier',
    'simplified_gyro_filter', 'simplified_gyro_filter_multiplier',
    'throttle_boost', 'throttle_boost_cutoff', 'thrust_linear',
}


def format_cli_value(val):
    if isinstance(val, list):
        return ','.join(str(v) for v in val)
    return str(val)


def build_cli_sections(headers):
    """构建 CLI 分段，全部为 set xxx = yyy 纯字符串"""
    a_lines, b_lines, c_lines, d_lines = [], [], [], []

    for key, val in headers.items():
        if val is None or val == '':
            continue
        line = f"set {key} = {format_cli_value(val)}"
        if key in CLI_A_CORE:
            a_lines.append(line)
        elif key in CLI_B_FILTERS:
            b_lines.append(line)
        elif key in CLI_C_CONTROLS:
            c_lines.append(line)
        elif key in CLI_D_CONTEXT:
            d_lines.append(line)

    return {
        'A_core': '\n'.join(a_lines),
        'B_filters': '\n'.join(b_lines),
        'C_controls': '\n'.join(c_lines),
        'D_context': '\n'.join(d_lines),
    }


def parse_bbl_to_json(bbl_bytes):
    """解析 BBL 文件，输出 <= 100K chars 的 JSON"""
    from orangebox import Parser
    import tempfile
    import os

    with tempfile.NamedTemporaryFile(delete=False, suffix='.BBL') as tmp:
        tmp.write(bbl_bytes)
        tmp_path = tmp.name

    try:
        parser = Parser.load(tmp_path)
    finally:
        os.unlink(tmp_path)

    headers = parser.headers
    field_names = parser.field_names
    frames_list = list(parser.frames())
    field_idx = {name: i for i, name in enumerate(field_names)}

    # 计算原始采样率
    looptime = safe_int(headers.get('looptime'), 125)
    pid_process_denom = safe_int(headers.get('pid_process_denom'), 1)
    sample_interval_us = looptime * pid_process_denom
    original_sample_rate = 1_000_000 / sample_interval_us

    # 字段索引
    time_idx = field_idx.get('time', -1)
    gyro_idx = [field_idx.get(f'gyroADC[{i}]', -1) for i in range(3)]
    rc_idx = [field_idx.get(f'rcCommand[{i}]', -1) for i in range(4)]
    setpoint_idx = [field_idx.get(f'setpoint[{i}]', -1) for i in range(3)]
    axis_p_idx = [field_idx.get(f'axisP[{i}]', -1) for i in range(2)]
    axis_i_idx = [field_idx.get(f'axisI[{i}]', -1) for i in range(2)]
    axis_d_idx = [field_idx.get(f'axisD[{i}]', -1) for i in range(2)]
    axis_f_idx = [field_idx.get(f'axisF[{i}]', -1) for i in range(2)]
    motor_idx = [field_idx.get(f'motor[{i}]', -1) for i in range(4)]
    erpm_idx = [field_idx.get(f'eRPM[{i}]', -1) for i in range(4)]
    vbat_idx = field_idx.get('vbatLatest', -1)
    amperage_idx = field_idx.get('amperageLatest', -1)

    # 收集所有帧数据
    all_time_us, all_vbat, all_amperage = [], [], []
    all_rc = [[], [], [], []]
    all_setpoint = [[], [], []]
    all_gyro = [[], [], []]
    all_axis_p, all_axis_i, all_axis_d, all_axis_f = [[], []], [[], []], [[], []], [[], []]
    all_motor = [[], [], [], []]
    all_erpm = [[], [], [], []]

    for idx, frame in enumerate(frames_list):
        data = frame.data
        if time_idx >= 0:
            try:
                all_time_us.append(int(data[time_idx]))
            except:
                all_time_us.append(idx * sample_interval_us)
        else:
            all_time_us.append(idx * sample_interval_us)

        for r in range(4):
            if rc_idx[r] >= 0:
                all_rc[r].append(safe_float(data[rc_idx[r]]))
        for s in range(3):
            if setpoint_idx[s] >= 0:
                all_setpoint[s].append(safe_float(data[setpoint_idx[s]]))
        for g in range(3):
            if gyro_idx[g] >= 0:
                all_gyro[g].append(safe_float(data[gyro_idx[g]]))
        for p in range(2):
            if axis_p_idx[p] >= 0:
                all_axis_p[p].append(safe_float(data[axis_p_idx[p]]))
            if axis_i_idx[p] >= 0:
                all_axis_i[p].append(safe_float(data[axis_i_idx[p]]))
            if axis_d_idx[p] >= 0:
                all_axis_d[p].append(safe_float(data[axis_d_idx[p]]))
            if axis_f_idx[p] >= 0:
                all_axis_f[p].append(safe_float(data[axis_f_idx[p]]))
        for m in range(4):
            if motor_idx[m] >= 0:
                all_motor[m].append(safe_float(data[motor_idx[m]]))
            if erpm_idx[m] >= 0:
                all_erpm[m].append(safe_float(data[erpm_idx[m]]))
        if vbat_idx >= 0:
            all_vbat.append(safe_float(data[vbat_idx]))
        if amperage_idx >= 0:
            all_amperage.append(safe_float(data[amperage_idx]))

    total_frames = len(all_time_us)
    duration_s = (all_time_us[-1] - all_time_us[0]) / 1_000_000 if all_time_us else 0

    # 统计特征（使用全部数据计算）
    gyro_rms = {
        'r': round(calculate_rms(all_gyro[0]), 1),
        'p': round(calculate_rms(all_gyro[1]), 1),
        'y': round(calculate_rms(all_gyro[2]), 1) if all_gyro[2] else 0,
    }
    gyro_peak = {
        'r': round(calculate_peak_frequency(all_gyro[0], original_sample_rate), 0),
        'p': round(calculate_peak_frequency(all_gyro[1], original_sample_rate), 0),
        'y': round(calculate_peak_frequency(all_gyro[2], original_sample_rate), 0) if all_gyro[2] else 0,
    }
    motor_avgs = [round(sum(m)/len(m), 0) if m else 0 for m in all_motor]
    motor_max = [int(max(m)) if m else 0 for m in all_motor]
    avg_all = sum(motor_avgs) / 4 if motor_avgs else 0
    imbalance = round(max(abs(a - avg_all) / avg_all for a in motor_avgs) if avg_all > 0 else 0, 3)
    vbat_min = round(min(all_vbat) / 100, 2) if all_vbat else 0
    vbat_max = round(max(all_vbat) / 100, 2) if all_vbat else 0
    amp_max = round(max(all_amperage) / 100, 1) if all_amperage else 0
    amp_avg = round(sum(all_amperage) / len(all_amperage) / 100, 1) if all_amperage else 0

    cli = build_cli_sections(headers)

    def build_frames(target_hz, use_delta_t=False):
        """构建 frames 数据"""
        step = max(1, int(original_sample_rate / target_hz))
        indices = list(range(0, total_frames, step))
        points = len(indices)

        # t: 时间戳
        if use_delta_t and points > 1:
            t0 = int(all_time_us[indices[0]] / 1000)
            t1 = int(all_time_us[indices[1]] / 1000) if len(indices) > 1 else t0
            dt = t1 - t0 if t1 > t0 else int(1000 / target_hz)
            t_data = {'t0': t0, 'dt': dt}
        else:
            t_data = [int(all_time_us[i] / 1000) for i in indices if i < len(all_time_us)]

        # rc: [r, p, y, thr] 整数
        rc = []
        for i in indices:
            if i < len(all_rc[0]):
                rc.append([int(all_rc[0][i]), int(all_rc[1][i]), int(all_rc[2][i]), int(all_rc[3][i])])

        # sp: [r, p, y] 1位小数
        sp = []
        for i in indices:
            if i < len(all_setpoint[0]):
                sp.append([round(all_setpoint[0][i], 1), round(all_setpoint[1][i], 1), round(all_setpoint[2][i], 1)])

        # g: [r, p, y] 1位小数
        g = []
        for i in indices:
            if i < len(all_gyro[0]):
                g.append([round(all_gyro[0][i], 1), round(all_gyro[1][i], 1), round(all_gyro[2][i], 1)])

        # p: [Pr, Ir, Dr, Fr, Pp, Ip, Dp, Fp] 整数
        p = []
        for i in indices:
            if i < len(all_axis_p[0]):
                p.append([
                    int(all_axis_p[0][i]) if i < len(all_axis_p[0]) else 0,
                    int(all_axis_i[0][i]) if i < len(all_axis_i[0]) else 0,
                    int(all_axis_d[0][i]) if i < len(all_axis_d[0]) else 0,
                    int(all_axis_f[0][i]) if i < len(all_axis_f[0]) else 0,
                    int(all_axis_p[1][i]) if i < len(all_axis_p[1]) else 0,
                    int(all_axis_i[1][i]) if i < len(all_axis_i[1]) else 0,
                    int(all_axis_d[1][i]) if i < len(all_axis_d[1]) else 0,
                    int(all_axis_f[1][i]) if i < len(all_axis_f[1]) else 0,
                ])

        # m: [m1, m2, m3, m4] 整数
        m = []
        for i in indices:
            if i < len(all_motor[0]):
                m.append([int(all_motor[0][i]), int(all_motor[1][i]), int(all_motor[2][i]), int(all_motor[3][i])])

        # rpm: [m1, m2, m3, m4] 整数
        rpm = []
        if all_erpm[0]:
            for i in indices:
                if i < len(all_erpm[0]):
                    rpm.append([
                        int(all_erpm[0][i]) if all_erpm[0] else 0,
                        int(all_erpm[1][i]) if all_erpm[1] else 0,
                        int(all_erpm[2][i]) if all_erpm[2] else 0,
                        int(all_erpm[3][i]) if all_erpm[3] else 0,
                    ])

        # v: 2位小数
        v = [round(all_vbat[i] / 100, 2) for i in indices if i < len(all_vbat)] if all_vbat else []

        # a: 1位小数
        a = [round(all_amperage[i] / 100, 1) for i in indices if i < len(all_amperage)] if all_amperage else []

        return {
            't': t_data,
            'rc': rc,
            'sp': sp,
            'g': g,
            'p': p,
            'm': m,
            'rpm': rpm,
            'v': v,
            'a': a,
        }, points, target_hz

    def build_result(target_hz, use_delta_t=False):
        frames, points, hz = build_frames(target_hz, use_delta_t)
        return {
            'meta': {
                'fw': headers.get('Firmware revision', ''),
                'board': headers.get('Board information', ''),
                'craft': headers.get('Craft name', ''),
                'duration_s': round(duration_s, 1),
                'total_frames': total_frames,
                'sample_rate_hz': hz,
                'points': points,
            },
            'cli': cli,
            'stats': {
                'gyro_rms': gyro_rms,
                'gyro_peak_hz': gyro_peak,
                'motor_avg': motor_avgs,
                'motor_max': motor_max,
                'motor_imbalance': imbalance,
                'vbat': [vbat_min, vbat_max],
                'amp': [amp_avg, amp_max],
            },
            'frames': frames,
        }

    # 自动降采样直到 <= 100K chars
    for target_hz in TARGET_HZ_LIST:
        result = build_result(target_hz, use_delta_t=False)
        compact = json.dumps(result, ensure_ascii=False, separators=(',', ':'))
        if len(compact) <= MAX_PAYLOAD_CHARS:
            return result

    # 兜底：使用 delta_t 模式节省字符
    result = build_result(TARGET_HZ_LIST[-1], use_delta_t=True)
    return result


@app.post("/decode")
async def decode_bbl(request: Request):
    try:
        content_type = request.headers.get('content-type', '')
        if 'application/json' in content_type:
            body = await request.json()
            bbl_base64 = body.get('bbl_base64')
            if not bbl_base64:
                raise HTTPException(status_code=400, detail="Missing bbl_base64 field")
            bbl_bytes = base64.b64decode(bbl_base64)
        else:
            bbl_bytes = await request.body()

        if not bbl_bytes:
            raise HTTPException(status_code=400, detail="Empty BBL data")

        result = parse_bbl_to_json(bbl_bytes)
        compact_json = json.dumps(result, ensure_ascii=False, separators=(',', ':'))
        return Response(content=compact_json, media_type="application/json")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to decode BBL: {str(e)}")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "bbl-decoder"}


async def on_fetch(request, env):
    import asgi
    return await asgi.fetch(app, request, env)


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python3 entry.py <bbl_file>")
        sys.exit(1)

    bbl_path = sys.argv[1]
    with open(bbl_path, 'rb') as f:
        bbl_bytes = f.read()

    print(f"Input: {bbl_path} ({len(bbl_bytes)} bytes)")
    result = parse_bbl_to_json(bbl_bytes)
    compact = json.dumps(result, ensure_ascii=False, separators=(',', ':'))

    print(f"\n=== Result ===")
    print(f"chars: {len(compact)}")
    print(f"sample_rate_hz: {result['meta']['sample_rate_hz']}")
    print(f"points: {result['meta']['points']}")
    print(f"duration_s: {result['meta']['duration_s']}")
    print(f"<= 100K: {'YES' if len(compact) <= 100000 else 'NO'}")

    output_path = bbl_path.rsplit('.', 1)[0] + '_decoded.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\nOutput: {output_path}")
