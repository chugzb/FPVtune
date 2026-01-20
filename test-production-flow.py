#!/usr/bin/env python3
"""
测试生产环境完整用户流程
URL: https://fpvtune.com/tune
邮箱: ningainshop@gmail.com
"""

from playwright.sync_api import sync_playwright
import time
import os

def test_production_flow():
    with sync_playwright() as p:
        # 启动浏览器 (非 headless 模式以便查看)
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # 监听控制台消息
        console_messages = []
        def handle_console(msg):
            console_messages.append({
                'type': msg.type,
                'text': msg.text,
                'location': msg.location
            })
            print(f"[CONSOLE {msg.type.upper()}] {msg.text}")

        page.on('console', handle_console)

        # 监听网络请求错误
        def handle_request_failed(request):
            print(f"[REQUEST FAILED] {request.url}")
            print(f"  Failure: {request.failure}")

        page.on('requestfailed', handle_request_failed)

        try:
            print("=== 步骤 1: 访问页面 ===")
            page.goto('https://fpvtune.com/tune')
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            print("\n=== 步骤 2: 上传 Blackbox 文件 ===")
            # 获取当前工作目录中的测试文件
            test_file = os.path.join(os.getcwd(), 'test-blackbox.txt')
            if not os.path.exists(test_file):
                print(f"错误: 测试文件不存在: {test_file}")
                return

            # 点击第一个 Choose File 按钮 (Blackbox Log)
            with page.expect_file_chooser() as fc_info:
                page.get_by_role('button', name='Choose File').first.click()
            file_chooser = fc_info.value
            file_chooser.set_files(test_file)

            time.sleep(2)

            # 点击 Continue 按钮
            page.get_by_role('button', name='Continue').click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            print("\n=== 步骤 3: 选择问题 (Problems) ===")
            # 选择 "Prop Wash"
            page.get_by_text('Prop Wash', exact=True).click()
            time.sleep(1)

            # 点击 Continue
            page.get_by_role('button', name='Continue').click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            print("\n=== 步骤 4: 选择目标 (Goals) ===")
            # 选择 "Locked-in Feel"
            page.get_by_text('Locked-in Feel', exact=True).click()
            time.sleep(1)

            # 点击 Continue
            page.get_by_role('button', name='Continue').click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            print("\n=== 步骤 5: 选择飞行风格 (Style) ===")
            # 选择 "Freestyle"
            page.get_by_text('Freestyle', exact=True).click()
            time.sleep(1)

            # 点击 Continue
            page.get_by_role('button', name='Continue').click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            print("\n=== 步骤 6: 选择机架尺寸 (Frame Size) ===")
            # 截图查看当前状态
            page.screenshot(path='screenshots/step6_frame_size_before.png', full_page=True)

            # 尝试多种方式选择 "5 inch"
            try:
                page.get_by_text('5 inch', exact=True).click(timeout=5000)
            except:
                try:
                    page.get_by_text('5 inch').first.click(timeout=5000)
                except:
                    # 如果找不到,打印页面内容
                    print("无法找到 '5 inch' 选项,打印页面内容:")
                    print(page.content()[:1000])
                    page.screenshot(path='screenshots/step6_frame_size_error.png', full_page=True)
                    raise

            time.sleep(1)

            # 点击 Continue
            page.get_by_role('button', name='Continue').click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)

            print("\n=== 步骤 7: 填写邮箱并提交支付 ===")
            # 填写邮箱
            email_input = page.get_by_placeholder('your@email.com')
            email_input.fill('ningainshop@gmail.com')
            time.sleep(1)

            # 点击 Proceed to Payment 按钮
            print("点击 Proceed to Payment...")
            page.get_by_role('button', name='Proceed to Payment').click()

            # 等待响应
            time.sleep(5)

            # 检查是否有错误消息
            page_content = page.content()
            if 'error' in page_content.lower() or 'failed' in page_content.lower():
                print("\n!!! 发现错误消息 !!!")
                page.screenshot(path='screenshots/payment_error.png', full_page=True)

            # 检查是否跳转到支付页面
            current_url = page.url
            print(f"\n当前 URL: {current_url}")

            if 'creem' in current_url or 'checkout' in current_url:
                print("✅ 成功跳转到支付页面")
                page.screenshot(path='screenshots/payment_page.png', full_page=True)
            else:
                print("❌ 未跳转到支付页面")
                page.screenshot(path='screenshots/payment_failed.png', full_page=True)

            # 等待一段时间以便查看
            time.sleep(5)

        except Exception as e:
            print(f"\n!!! 测试过程中出现异常 !!!")
            print(f"错误: {e}")
            page.screenshot(path='screenshots/error_state.png', full_page=True)

        finally:
            # 打印所有控制台错误
            print("\n=== 控制台错误汇总 ===")
            errors = [msg for msg in console_messages if msg['type'] == 'error']
            if errors:
                for error in errors:
                    print(f"[ERROR] {error['text']}")
            else:
                print("没有控制台错误")

            browser.close()

if __name__ == '__main__':
    test_production_flow()
