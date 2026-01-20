#!/usr/bin/env python3
"""
完整测试生产环境用户流程
URL: https://fpvtune.com/tune
邮箱: ningainshop@gmail.com
"""

from playwright.sync_api import sync_playwright
import time
import os

def test_complete_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # 监听控制台消息
        console_errors = []
        def handle_console(msg):
            if msg.type == 'error':
                console_errors.append(msg.text)
                print(f"[CONSOLE ERROR] {msg.text}")

        page.on('console', handle_console)

        # 监听网络请求
        api_responses = {}
        def handle_response(response):
            if '/api/' in response.url:
                api_responses[response.url] = {
                    'status': response.status,
                    'url': response.url
                }
                print(f"[API] {response.status} {response.url}")

        page.on('response', handle_response)

        try:
            print("\n=== 开始测试生产环境 ===\n")

            # 步骤 1: 访问页面
            print("步骤 1: 访问 https://fpvtune.com/tune")
            page.goto('https://fpvtune.com/tune')
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            page.screenshot(path='screenshots/prod_step1_upload.png', full_page=True)
            print("✓ 页面加载完成")

            # 步骤 2: 上传文件
            print("\n步骤 2: 上传 Blackbox 文件")
            test_file = 'test-blackbox.txt'

            if not os.path.exists(test_file):
                print(f"警告: 测试文件不存在,跳过文件上传测试")
                return

            # 上传文件
            file_input = page.locator('input[type="file"]').first
            file_input.set_input_files(test_file)
            time.sleep(2)
            print("✓ 文件已上传")

            # 点击 Continue
            page.get_by_role('button', name='Continue').click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            page.screenshot(path='screenshots/prod_step2_problems.png', full_page=True)
            print("✓ 进入问题选择页面")

            # 步骤 3: 选择问题
            print("\n步骤 3: 选择问题 - Prop Wash")
            page.get_by_text('Prop Wash', exact=True).click()
            time.sleep(1)
            page.get_by_role('button', name='Continue').click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            page.screenshot(path='screenshots/prod_step3_goals.png', full_page=True)
            print("✓ 已选择 Prop Wash")

            # 步骤 4: 选择目标
            print("\n步骤 4: 选择目标 - Locked-in Feel")
            page.get_by_text('Locked-in Feel', exact=True).click()
            time.sleep(1)
            page.get_by_role('button', name='Continue').click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            page.screenshot(path='screenshots/prod_step4_style.png', full_page=True)
            print("✓ 已选择 Locked-in Feel")

            # 步骤 5: 选择飞行风格
            print("\n步骤 5: 选择飞行风格 - Freestyle")
            page.get_by_text('Freestyle', exact=True).click()
            time.sleep(1)
            page.get_by_role('button', name='Continue').click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            page.screenshot(path='screenshots/prod_step5_frame.png', full_page=True)
            print("✓ 已选择 Freestyle")

            # 步骤 6: 选择机架尺寸
            print("\n步骤 6: 选择机架尺寸 - 5 inch")
            current_url = page.url
            print(f"当前 URL: {current_url}")

            # 尝试多种方式查找并点击 5 inch
            try:
                page.locator('text=5 inch').first.click(timeout=3000)
            except:
                try:
                    page.locator('text=5').first.click(timeout=3000)
                except:
                    print("无法找到 5 inch 选项，尝试查找所有文本...")
                    all_text = page.locator('body').text_content()
                    print(f"页面文本片段: {all_text[:500]}")
                    raise

            time.sleep(1)
            page.get_by_role('button', name='Continue').click()
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            page.screenshot(path='screenshots/prod_step6_payment.png', full_page=True)
            print("✓ 已选择 5 inch")

            # 步骤 7: 填写邮箱并提交
            print("\n步骤 7: 填写邮箱并提交支付")
            page.get_by_placeholder('your@email.com').fill('ningainshop@gmail.com')
            time.sleep(1)
            print("✓ 已填写邮箱: ningainshop@gmail.com")

            # 点击 Proceed to Payment
            print("\n点击 Proceed to Payment...")
            page.get_by_role('button', name='Proceed to Payment').click()

            # 等待 API 响应
            time.sleep(5)

            # 检查 checkout API 响应
            checkout_api = None
            for url, resp in api_responses.items():
                if '/api/tune/checkout' in url:
                    checkout_api = resp
                    break

            if checkout_api:
                print(f"\n✓ Checkout API 响应: {checkout_api['status']}")
                if checkout_api['status'] == 200:
                    print("✅ Checkout API 成功")
                else:
                    print(f"❌ Checkout API 失败: {checkout_api['status']}")
            else:
                print("❌ 未检测到 Checkout API 调用")

            # 检查最终 URL
            final_url = page.url
            print(f"\n最终 URL: {final_url}")

            if 'creem' in final_url or 'checkout' in final_url:
                print("✅ 成功跳转到支付页面")
                page.screenshot(path='screenshots/prod_step7_success.png', full_page=True)
            else:
                print("❌ 未跳转到支付页面")
                page.screenshot(path='screenshots/prod_step7_failed.png', full_page=True)

            # 等待查看
            time.sleep(3)

        except Exception as e:
            print(f"\n❌ 测试失败: {e}")
            page.screenshot(path='screenshots/prod_error.png', full_page=True)
            import traceback
            traceback.print_exc()

        finally:
            # 打印控制台错误汇总
            print("\n=== 控制台错误汇总 ===")
            if console_errors:
                for i, error in enumerate(console_errors[:10], 1):
                    print(f"{i}. {error[:200]}")
            else:
                print("无控制台错误")

            # 打印 API 调用汇总
            print("\n=== API 调用汇总 ===")
            for url, resp in api_responses.items():
                print(f"{resp['status']} - {url}")

            browser.close()
            print("\n=== 测试完成 ===")

if __name__ == '__main__':
    test_complete_flow()
