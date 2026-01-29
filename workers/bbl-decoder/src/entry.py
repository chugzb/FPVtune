"""
BBL (Betaflight Blackbox Log) Decoder Service
只提取头信息，不解析帧数据
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response
import base64
import json

app = FastAPI()


def safe_int(val, default=0):
    if val is None or val == '':
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default


def format_cli_value(val):
    if isinstance(val, list):
        return ','.join(str(v) for v in val)
    return str(val)


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


def build_cli_sections(headers):
    """构建 CLI 分段"""
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


def parse_bbl_header(bbl_bytes):
    """只解析 BBL 头信息，不解析帧数据"""
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

    # 计算采样率信息
    looptime = safe_int(headers.get('looptime'), 125)
    pid_process_denom = safe_int(headers.get('pid_process_denom'), 1)
    sample_interval_us = looptime * pid_process_denom
    sample_rate = 1_000_000 / sample_interval_us

    cli = build_cli_sections(headers)

    return {
        'meta': {
            'fw': headers.get('Firmware revision', ''),
            'board': headers.get('Board information', ''),
            'craft': headers.get('Craft name', ''),
            'looptime': looptime,
            'pid_denom': pid_process_denom,
            'sample_rate_hz': round(sample_rate, 0),
        },
        'cli': cli,
    }


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

        result = parse_bbl_header(bbl_bytes)
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
    result = parse_bbl_header(bbl_bytes)
    compact = json.dumps(result, ensure_ascii=False, separators=(',', ':'))

    print(f"\n=== Result ===")
    print(f"chars: {len(compact)}")
    print(json.dumps(result, ensure_ascii=False, indent=2))
