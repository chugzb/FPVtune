from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 测试首页导航栏
    print("=== 测试首页导航栏 ===")
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    # 检查首页导航栏链接
    nav_links = page.locator('nav a').all_text_contents()
    print(f"首页导航栏链接: {nav_links}")

    # 测试 About 页面
    print("\n=== 测试 About 页面导航栏 ===")
    page.goto('http://localhost:3000/about')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    nav_links = page.locator('nav a').all_text_contents()
    print(f"About 页面导航栏链接: {nav_links}")
    page.screenshot(path='screenshots/about_navbar.png')

    # 测试 Contact 页面
    print("\n=== 测试 Contact 页面导航栏 ===")
    page.goto('http://localhost:3000/contact')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    nav_links = page.locator('nav a').all_text_contents()
    print(f"Contact 页面导航栏链接: {nav_links}")
    page.screenshot(path='screenshots/contact_navbar.png')

    # 测试 FAQ 页面
    print("\n=== 测试 FAQ 页面导航栏 ===")
    page.goto('http://localhost:3000/faq')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    nav_links = page.locator('nav a').all_text_contents()
    print(f"FAQ 页面导航栏链接: {nav_links}")
    page.screenshot(path='screenshots/faq_navbar.png')

    # 测试 Refund 页面
    print("\n=== 测试 Refund 页面导航栏 ===")
    page.goto('http://localhost:3000/refund')
    page.wait_for_load_state('networkidle')
    time.sleep(2)

    nav_links = page.locator('nav a').all_text_contents()
    print(f"Refund 页面导航栏链接: {nav_links}")
    page.screenshot(path='screenshots/refund_navbar.png')

    browser.close()
    print("\n✅ 测试完成！截图已保存到 screenshots/")
