#!/usr/bin/env python3
"""Test orangebox BBL parser"""

from orangebox import Parser
import json

BBL_PATH = '/Users/a1/A1项目/fpv/public/test bll txt/BTFL_BLACKBOX_LOG_20260113_154353_JHEF745V2五寸竞速胶带.BBL'

def main():
    print('=== Orangebox BBL Parser Test ===\n')

    # 加载文件
    print('1. Loading BBL file...')
    parser = Parser.load(BBL_PATH)
    print(f'   ✓ File loaded\n')

    # 获取 header
    print('2. Headers:')
    headers = parser.headers
    print(f'   - Firmware: {headers.get("Firmware type", "N/A")} {headers.get("Firmware revision", "N/A")}')
    print(f'   - Craft Name: {headers.get("Craft name", "N/A")}')
    print(f'   - Board: {headers.get("Board information", "N/A")}')
    print(f'   - Looptime: {headers.get("looptime", "N/A")}')
    print('')

    # 打印所有 header 字段
    print('3. All header fields:')
    for key, value in sorted(headers.items()):
        print(f'   {key}: {value}')
    print('')

    # 获取帧数据
    print('4. Frame data:')
    print(f'   - Field names: {parser.field_names}')
    
    # frames() 是方法，需要调用
    frames_list = list(parser.frames())
    print(f'   - Total frames: {len(frames_list)}')
    print('')

    # 显示前 5 帧
    if frames_list:
        print('5. First 5 frames:')
        for i, frame in enumerate(frames_list[:5]):
            frame_dict = dict(zip(parser.field_names, frame.data))
            # 只显示关键字段
            key_fields = ['time', 'gyroADC[0]', 'gyroADC[1]', 'setpoint[0]', 'motor[0]']
            filtered = {k: frame_dict.get(k) for k in key_fields if k in frame_dict}
            print(f'   Frame {i}: {filtered}')
        print('')

    # 计算一些统计信息
    if frames_list:
        print('6. Statistics:')
        field_names = parser.field_names
        
        # 查找字段索引
        gyro_fields = [f for f in field_names if 'gyroADC' in f]
        motor_fields = [f for f in field_names if 'motor[' in f and 'eRPM' not in f]
        
        print(f'   - Gyro fields: {gyro_fields}')
        print(f'   - Motor fields: {motor_fields}')
        print(f'   - Frame count: {len(frames_list)}')

    print('\n=== Test Complete ===')

if __name__ == '__main__':
    main()
