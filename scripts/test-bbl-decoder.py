#!/usr/bin/env python3
"""
测试 BBL Decoder 本地解析
"""

import sys
import os
import json

# 添加 workers/bbl-decoder/src 到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'workers', 'bbl-decoder', 'src'))

from entry import parse_bbl_to_json

def test_bbl_file(filepath: str):
    print(f"\n{'='*60}")
    print(f"Testing: {os.path.basename(filepath)}")
    print(f"File size: {os.path.getsize(filepath) / 1024 / 1024:.2f} MB")
    print('='*60)

    with open(filepath, 'rb') as f:
        bbl_bytes = f.read()

    try:
        result = parse_bbl_to_json(bbl_bytes)

        # 输出元数据
        print("\n## Meta:")
        for k, v in result['meta'].items():
            print(f"  {k}: {v}")

        # 输出统计
        print("\n## Statistics:")
        print(f"  Gyro RMS: {result['statistics']['gyro']['rms']}")
        print(f"  Gyro Peak Hz: {result['statistics']['gyro']['peak_hz']}")
        print(f"  Motor Saturation: {result['statistics']['motor']['saturation_ratio']*100:.2f}%")
        print(f"  Motor Imbalance: {result['statistics']['motor']['imbalance_ratio']*100:.2f}%")
        print(f"  Battery: {result['statistics']['battery']['vbat_min_v']}V - {result['statistics']['battery']['vbat_max_v']}V")
        print(f"  Current Max: {result['statistics']['current']['max_a']}A")

        # 输出采样信息
        print("\n## Samples:")
        print(f"  Count: {result['samples']['time_base']['count']}")
        print(f"  dt_us: {result['samples']['time_base']['dt_us']}")
        print(f"  eRPM available: {len(result['samples']['erpm']['m1']) > 0}")

        # 输出 Header 字段数量
        print("\n## Header Fields:")
        for category, fields in result['header'].items():
            print(f"  {category}: {len(fields)} fields")

        # 保存完整 JSON
        output_path = filepath.replace('.bbl', '_decoded.json').replace('.BBL', '_decoded.json')
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        # 计算 JSON 大小
        compact_json = json.dumps(result, ensure_ascii=False, separators=(',', ':'))
        print(f"\n## Output:")
        print(f"  JSON size (compact): {len(compact_json) / 1024:.2f} KB")
        print(f"  Saved to: {output_path}")

        return result

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == '__main__':
    # 测试小文件
    test_bbl_file('public/test bll txt/BTFL_BLACKBOX_LOG_20260113_154353_JHEF745V2五寸竞速胶带.BBL')

    # 测试大文件
    test_bbl_file('public/test bll txt/btfl_all.bbl')
