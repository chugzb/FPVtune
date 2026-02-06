#!/usr/bin/env python3
import json
import requests

# 读取解码后的 BBL 数据
with open('/tmp/decoded_bbl.json', 'r') as f:
    bbl_full = json.load(f)

# 只取关键部分
bbl_data = {
    'meta': bbl_full.get('meta', {}),
    'stats': bbl_full.get('stats', {}),
    'cli': bbl_full.get('cli', {})
}

bbl_json = json.dumps(bbl_data, ensure_ascii=False)
print(f"BBL data size: {len(bbl_json)} bytes\n")

system_prompt = """你是 Betaflight PID 调参专家。分析黑盒数据，根据你的专业判断优化 PID 参数。

输出格式（必须严格遵守，不要输出任何解释）：

# PID Settings
set p_roll = [优化后的值]
set i_roll = [优化后的值]
set d_roll = [优化后的值]
set f_roll = [优化后的值]
set p_pitch = [优化后的值]
set i_pitch = [优化后的值]
set d_pitch = [优化后的值]
set f_pitch = [优化后的值]
set p_yaw = [优化后的值]
set i_yaw = [优化后的值]
set d_yaw = [优化后的值]
set f_yaw = [优化后的值]

# Filter Settings
set gyro_lpf1_dyn_min_hz = [优化后的值]
set gyro_lpf1_dyn_max_hz = [优化后的值]
set dterm_lpf1_dyn_min_hz = [优化后的值]
set dterm_lpf1_dyn_max_hz = [优化后的值]
set dyn_notch_count = [优化后的值]
set dyn_notch_q = [优化后的值]
set dyn_notch_min_hz = [优化后的值]
set dyn_notch_max_hz = [优化后的值]

# Other Settings
set d_max_gain = [优化后的值]
set d_max_advance = [优化后的值]
set feedforward_boost = [优化后的值]
set tpa_rate = [优化后的值]
set tpa_breakpoint = [优化后的值]
set iterm_relax_cutoff = [优化后的值]
set throttle_boost = [优化后的值]
set motor_output_limit = [优化后的值]
set anti_gravity_gain = [优化后的值]

save

用户问题: 振动过大, 电机过热
调参目标: 更顺滑的飞行, 减少振动
飞行风格: 自由式
机架尺寸: 5寸

输出要求:
1. 只输出 CLI 命令，从 # PID Settings 开始，以 save 结束
2. 不要输出任何解释、分析或其他文字"""

user_msg = f"这是解码后的黑匣子数据：\n{bbl_json}\n\n请根据黑匣子数据分析并输出优化后的 PID 参数。"

# Test gpt-5.1 on future-api
print("=== Testing future-api.vodeshop.com (gpt-5.1) ===")
resp1 = requests.post(
    "https://future-api.vodeshop.com/v1/chat/completions",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer sk-fJfxnb96RtsJLJO7oNAW5VQ5rUijYl1byPxQwVkM56Mu1mzz"
    },
    json={
        "model": "gpt-5.1",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg}
        ],
        "temperature": 0.3,
        "max_tokens": 2000
    },
    timeout=120
)
result1 = resp1.json()
print(result1.get('choices', [{}])[0].get('message', {}).get('content', 'No response'))

print("\n" + "="*60 + "\n")

# Test gpt-5.2 on api.ruxa.ai
print("=== Testing api.ruxa.ai (gpt-5.2) ===")
resp2 = requests.post(
    "https://api.ruxa.ai/v1/chat/completions",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer sk-e2aPJ9psztyghWTIxewYEhIunUgAOFJqyVniWAp48lZGFMjU"
    },
    json={
        "model": "gpt-5.2",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_msg}
        ],
        "temperature": 0.3,
        "max_tokens": 2000
    },
    timeout=120
)
result2 = resp2.json()
print(result2.get('choices', [{}])[0].get('message', {}).get('content', 'No response'))
