"""
BBL (Betaflight Blackbox Log) Decoder Service
输出标准化 JSON 供 AI 分析，payload <= 100K chars
支持多段飞行记录，自动选择最长的一段
采样率优先使用 500Hz-200Hz（GPT 推荐的 PID 调参分析范围）
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response
import base64
import json
import math

# Monkey-patch orangebox to handle errors gracefully
def _patch_orangebox():
    """Patch orangebox to skip unknown event types and invalid log end instead of crashing"""
    try:
        from orangebox import parser as ob_parser
        from orangebox.events import event_map
        from orangebox.types import EventType, Event
        import logging
        _log = logging.getLogger("orangebox.parser")

        def patched_parse_event(self, reader):
            byte = next(reader)
            try:
                event_type = EventType(byte)
            except ValueError:
                _log.warning(f"Unknown event type: {byte}")
                return False

            # Check if event_type is in event_map
            if event_type not in event_map:
                _log.warning(f"Unhandled event type: {event_type}")
                return False

            # Call parser with error handling
            try:
                parser_func = event_map[event_type]
                event_data = parser_func(reader)
                self.events.append(Event(event_type, event_data))
                if event_type == EventType.LOG_END:
                    self._end_of_log = True
            except ValueError as e:
                # Handle "Invalid 'End of log' message" and similar errors
                _log.warning(f"Event parse error ({event_type}): {e}")
                if event_type == EventType.LOG_END:
                    self._end_of_log = True  # Still mark as end of log
                return False
            return True

        ob_parser.Parser._parse_event_frame = patched_parse_event
        print("[BBL Decoder] Orangebox patched for error handling")
    except Exception as e:
        print(f"[BBL Decoder] Failed to patch orangebox: {e}")

_patch_orangebox()

app = FastAPI()

MAX_PAYLOAD_CHARS = 500000  # 测试极限：500K chars（约 125K tokens）
# 采样率列表：最低 200Hz，保证 PID 调参分析精度
TARGET_HZ_LIST = [1000, 500, 250, 200]


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


def find_flight_segments(all_time_us, all_motor, sample_interval_us):
    """
    检测飞行记录中的多个段落（通过时间跳跃或电机停止来分割）
    返回每个段落的 (start_idx, end_idx, duration_s)
    """
    if not all_time_us or len(all_time_us) < 10:
        return [(0, len(all_time_us), 0)]

    segments = []
    segment_start = 0

    # 时间跳跃阈值：超过 1 秒认为是新段落
    time_gap_threshold_us = 1_000_000

    for i in range(1, len(all_time_us)):
        time_gap = all_time_us[i] - all_time_us[i-1]

        # 检测时间跳跃（新的飞行段落）
        is_time_gap = time_gap > time_gap_threshold_us or time_gap < 0

        if is_time_gap:
            # 保存当前段落
            if i - segment_start >= 10:  # 至少 10 帧才算有效段落
                duration = (all_time_us[i-1] - all_time_us[segment_start]) / 1_000_000
                segments.append((segment_start, i, duration))
            segment_start = i

    # 保存最后一个段落
    if len(all_time_us) - segment_start >= 10:
        duration = (all_time_us[-1] - all_time_us[segment_start]) / 1_000_000
        segments.append((segment_start, len(all_time_us), duration))

    # 如果没有找到有效段落，返回整个数据
    if not segments:
        duration = (all_time_us[-1] - all_time_us[0]) / 1_000_000
        segments = [(0, len(all_time_us), duration)]

    return segments


def find_all_logs(bbl_bytes):
    """查找 BBL 文件中所有独立的飞行记录"""
    import re
    # 查找所有 header 位置
    headers = list(re.finditer(b'H Product:Blackbox', bbl_bytes))
    if not headers:
        return [(0, len(bbl_bytes))]

    logs = []
    for i in range(len(headers)):
        start = headers[i].start()
        end = headers[i+1].start() if i+1 < len(headers) else len(bbl_bytes)
        logs.append((start, end))
    return logs


def parse_single_log(bbl_bytes):
    """解析单个 log 的数据"""
    from orangebox import Parser
    import tempfile
    import os

    with tempfile.NamedTemporaryFile(delete=False, suffix='.BBL') as tmp:
        tmp.write(bbl_bytes)
        tmp_path = tmp.name

    try:
        parser = Parser.load(tmp_path)
        headers = parser.headers
        field_names = parser.field_names
        frames_list = list(parser.frames())
        return headers, field_names, frames_list
    finally:
        os.unlink(tmp_path)


def parse_bbl_to_json(bbl_bytes):
    """解析 BBL 文件，输出 <= 500K chars 的 JSON
    支持多 log 文件，自动选择最长的 log
    """
    from orangebox import Parser
    import tempfile
    import os

    # 检测文件中所有 log
    all_logs = find_all_logs(bbl_bytes)
    total_logs = len(all_logs)
    best_log_idx = 0  # 默认使用第一个 log

    if total_logs > 1:
        print(f"[BBL Decoder] Found {total_logs} logs in file, analyzing each...")

        # 解析每个 log，找出最长的
        best_log_idx = 0
        best_duration = 0
        log_durations = []

        for i, (start, end) in enumerate(all_logs):
            try:
                log_bytes = bbl_bytes[start:end]
                _, field_names, frames = parse_single_log(log_bytes)

                if len(frames) < 10:
                    log_durations.append(0)
                    continue

                # 计算时长
                field_idx = {name: j for j, name in enumerate(field_names)}
                time_idx = field_idx.get('time', -1)

                if time_idx >= 0:
                    first_time = frames[0].data[time_idx]
                    last_time = frames[-1].data[time_idx]
                    duration = (last_time - first_time) / 1_000_000
                else:
                    duration = len(frames) / 1000  # 估算

                log_durations.append(duration)

                if duration > best_duration:
                    best_duration = duration
                    best_log_idx = i

            except Exception as e:
                print(f"[BBL Decoder] Log {i+1} parse error: {e}")
                log_durations.append(0)

        print(f"[BBL Decoder] Log durations: {[round(d, 1) for d in log_durations]}s")
        print(f"[BBL Decoder] Using log {best_log_idx + 1} ({round(best_duration, 1)}s)")

        # 使用最长的 log
        start, end = all_logs[best_log_idx]
        bbl_bytes = bbl_bytes[start:end]

    # 解析选中的 log
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

    # 检测多段飞行记录，选择最长的一段
    segments = find_flight_segments(all_time_us, all_motor, sample_interval_us)

    # 选择最长的段落
    longest_segment = max(segments, key=lambda x: x[2])
    seg_start, seg_end, seg_duration = longest_segment
    total_segments = len(segments)

    print(f"[BBL Decoder] Found {total_segments} flight segment(s)")
    if total_segments > 1:
        print(f"[BBL Decoder] Segment durations: {[round(s[2], 1) for s in segments]}s")
        print(f"[BBL Decoder] Using longest segment: {round(seg_duration, 1)}s ({seg_end - seg_start} frames)")

    # 截取最长段落的数据
    def slice_data(data_list, start, end):
        if isinstance(data_list, list) and len(data_list) > 0:
            if isinstance(data_list[0], list):
                return [d[start:end] for d in data_list]
            return data_list[start:end]
        return data_list

    all_time_us = all_time_us[seg_start:seg_end]
    all_vbat = all_vbat[seg_start:seg_end] if all_vbat else []
    all_amperage = all_amperage[seg_start:seg_end] if all_amperage else []
    all_rc = [rc[seg_start:seg_end] for rc in all_rc]
    all_setpoint = [sp[seg_start:seg_end] for sp in all_setpoint]
    all_gyro = [g[seg_start:seg_end] for g in all_gyro]
    all_axis_p = [p[seg_start:seg_end] for p in all_axis_p]
    all_axis_i = [i[seg_start:seg_end] for i in all_axis_i]
    all_axis_d = [d[seg_start:seg_end] for d in all_axis_d]
    all_axis_f = [f[seg_start:seg_end] for f in all_axis_f]
    all_motor = [m[seg_start:seg_end] for m in all_motor]
    all_erpm = [e[seg_start:seg_end] for e in all_erpm]

    total_frames = len(all_time_us)
    duration_s = (all_time_us[-1] - all_time_us[0]) / 1_000_000 if all_time_us else 0

    # 统计特征（使用选中段落的数据计算）
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
        """构建 frames 数据，优化格式减少体积"""
        step = max(1, int(original_sample_rate / target_hz))
        indices = list(range(0, total_frames, step))
        points = len(indices)

        # t: 时间戳（使用 delta_t 模式节省空间）
        if points > 1:
            t0 = int(all_time_us[indices[0]] / 1000)
            t1 = int(all_time_us[indices[1]] / 1000) if len(indices) > 1 else t0
            dt = t1 - t0 if t1 > t0 else int(1000 / target_hz)
            t_data = {'t0': t0, 'dt': dt}
        else:
            t_data = {'t0': 0, 'dt': int(1000 / target_hz)}

        # rc: [thr] 只保留油门（最重要），整数
        rc = [int(all_rc[3][i]) for i in indices if i < len(all_rc[3])]

        # sp: [r, p, y] setpoint，整数（减少小数）
        sp = []
        for i in indices:
            if i < len(all_setpoint[0]):
                sp.append([int(all_setpoint[0][i]), int(all_setpoint[1][i]), int(all_setpoint[2][i])])

        # g: [r, p, y] gyro，整数
        g = []
        for i in indices:
            if i < len(all_gyro[0]):
                g.append([int(all_gyro[0][i]), int(all_gyro[1][i]), int(all_gyro[2][i])])

        # pid: [Pr, Dr, Pp, Dp] 只保留 roll/pitch 的 P 和 D（最关键）
        pid = []
        for i in indices:
            if i < len(all_axis_p[0]):
                pid.append([
                    int(all_axis_p[0][i]) if i < len(all_axis_p[0]) else 0,
                    int(all_axis_d[0][i]) if i < len(all_axis_d[0]) else 0,
                    int(all_axis_p[1][i]) if i < len(all_axis_p[1]) else 0,
                    int(all_axis_d[1][i]) if i < len(all_axis_d[1]) else 0,
                ])

        # m: [m1, m2, m3, m4] 电机输出，整数
        m = []
        for i in indices:
            if i < len(all_motor[0]):
                m.append([int(all_motor[0][i]), int(all_motor[1][i]), int(all_motor[2][i]), int(all_motor[3][i])])

        return {
            't': t_data,
            'rc': rc,  # 只有油门
            'sp': sp,
            'g': g,
            'pid': pid,  # 简化的 PID 输出
            'm': m,
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
                'logs_found': total_logs,
                'log_used': best_log_idx + 1,
                'segments_found': total_segments,
                'segment_used': 'longest',
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
            print(f"[BBL Decoder] Output: {len(compact)} chars @ {target_hz}Hz, {result['meta']['points']} points")
            return result

    # 兜底：使用 delta_t 模式节省字符
    result = build_result(TARGET_HZ_LIST[-1], use_delta_t=True)
    compact = json.dumps(result, ensure_ascii=False, separators=(',', ':'))
    print(f"[BBL Decoder] Output (delta_t mode): {len(compact)} chars @ {TARGET_HZ_LIST[-1]}Hz")
    return result


@app.post("/decode")
async def decode_bbl(request: Request):
    import traceback
    import io
    import sys

    # 捕获所有 print 输出
    log_buffer = io.StringIO()
    debug_mode = request.headers.get('X-Debug', '').lower() == 'true'

    try:
        content_type = request.headers.get('content-type', '')

        # 处理 multipart/form-data (文件上传)
        if 'multipart/form-data' in content_type:
            form = await request.form()
            file = form.get('file')
            if file:
                bbl_bytes = await file.read()
            else:
                raise HTTPException(status_code=400, detail="No file in form data")
        elif 'application/json' in content_type:
            body = await request.json()
            bbl_base64 = body.get('bbl_base64')
            if not bbl_base64:
                raise HTTPException(status_code=400, detail="Missing bbl_base64 field")
            bbl_bytes = base64.b64decode(bbl_base64)
        else:
            bbl_bytes = await request.body()

        if not bbl_bytes:
            raise HTTPException(status_code=400, detail="Empty BBL data")

        log_buffer.write(f"[DEBUG] Received {len(bbl_bytes)} bytes\n")

        # 重定向 stdout 来捕获 print
        old_stdout = sys.stdout
        sys.stdout = log_buffer

        try:
            result = parse_bbl_to_json(bbl_bytes)
        finally:
            sys.stdout = old_stdout

        log_buffer.write(f"[DEBUG] Parse complete: {result['meta']['points']} points\n")

        if debug_mode:
            # 调试模式：返回日志和结果
            return {
                "logs": log_buffer.getvalue(),
                "result": result
            }
        else:
            compact_json = json.dumps(result, ensure_ascii=False, separators=(',', ':'))
            return Response(content=compact_json, media_type="application/json")
    except HTTPException:
        raise
    except Exception as e:
        error_trace = traceback.format_exc()
        log_buffer.write(f"[ERROR] {error_trace}\n")

        if debug_mode:
            return {
                "logs": log_buffer.getvalue(),
                "error": str(e),
                "traceback": error_trace
            }
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
    print(f"segments_found: {result['meta']['segments_found']}")
    print(f"<= 100K: {'YES' if len(compact) <= 100000 else 'NO'}")

    output_path = bbl_path.rsplit('.', 1)[0] + '_decoded.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\nOutput: {output_path}")
