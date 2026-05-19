#!/usr/bin/env node

/**
 * 菜单导航测试脚本
 * 测试流程：
 * 1. 登录系统
 * 2. 遍历所有菜单项并点击，验证页面加载
 */

import puppeteer from 'puppeteer';
import { UNIFIED_CONFIG } from './unified-config.js';

// 测试结果统计
const testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    menuResults: []
};

/**
 * 记录测试结果
 */
function recordTest(name, passed, message = '') {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`✅ [PASS] ${name}${message ? ': ' + message : ''}`);
    } else {
        testResults.failed++;
        console.log(`❌ [FAIL] ${name}${message ? ': ' + message : ''}`);
    }
}

/**
 * 等待指定时间
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 登录函数
 */
async function login(page) {
    console.log('🔐 步骤 1: 登录系统...');
    
    const loginUrl = `${UNIFIED_CONFIG.server.baseUrl}/login`;
    console.log(`   访问登录页面: ${loginUrl}`);
    
    await page.goto(loginUrl, {
        waitUntil: 'networkidle2',
        timeout: UNIFIED_CONFIG.timeouts.navigation
    });
    
    await wait(500);
    
    // 查找用户名输入框
    const usernameSelectors = [
        'input[name="username"]',
        'input[placeholder*="用户名"]',
        'input[placeholder*="用户"]',
        '.ant-input[placeholder*="用户名"]'
    ];
    
    let usernameInput = null;
    for (const selector of usernameSelectors) {
        usernameInput = await page.$(selector);
        if (usernameInput) break;
    }
    
    // 查找密码输入框
    const passwordSelectors = [
        'input[name="password"]',
        'input[type="password"]',
        'input[placeholder*="密码"]',
        '.ant-input-password input'
    ];
    
    let passwordInput = null;
    for (const selector of passwordSelectors) {
        passwordInput = await page.$(selector);
        if (passwordInput) break;
    }
    
    // 查找登录按钮
    let submitButton = null;
    try {
        const submitButtons = await page.$$('button[type="submit"]');
        if (submitButtons.length > 0) {
            submitButton = submitButtons[0];
        }
    } catch (error) {
        // 忽略错误
    }
    
    if (!usernameInput || !passwordInput || !submitButton) {
        throw new Error('无法找到登录表单元素');
    }
    
    // 填写用户名
    await usernameInput.click();
    await wait(100);
    await page.evaluate((el) => {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }, usernameInput);
    await wait(50);
    await usernameInput.type(UNIFIED_CONFIG.login.username, { delay: 30 });
    await wait(200);
    
    // 填写密码
    await passwordInput.click();
    await wait(100);
    await page.evaluate((el) => {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }, passwordInput);
    await wait(50);
    await passwordInput.type(UNIFIED_CONFIG.login.password, { delay: 30 });
    await wait(200);
    
    // 点击登录按钮
    await submitButton.click();
    console.log('   ✅ 已点击登录按钮');
    
    // 等待登录完成
    try {
        await Promise.race([
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => null),
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => null),
            wait(3000)
        ]);
    } catch (error) {
        // 忽略错误
    }
    
    await wait(800);
    
    // 验证登录是否成功
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('/login') && currentUrl !== loginUrl;
    
    if (isLoggedIn) {
        console.log(`   ✅ 登录成功，当前URL: ${currentUrl}`);
        recordTest('登录', true, `跳转到: ${currentUrl}`);
        return true;
    } else {
        console.log(`   ❌ 登录可能失败，当前URL: ${currentUrl}`);
        recordTest('登录', false, `仍在登录页面`);
        return false;
    }
}

/**
 * 获取所有可点击的菜单项
 */
async function getAllMenuItems(page) {
    console.log('📋 步骤 2: 获取所有菜单项...');
    
    // 确保侧边栏是展开的
    try {
        const sidebar = await page.$('.ant-layout-sider');
        if (sidebar) {
            const isCollapsed = await page.evaluate((el) => {
                return el.classList.contains('ant-layout-sider-collapsed');
            }, sidebar);
            
            if (isCollapsed) {
                console.log('   📂 侧边栏已折叠，尝试展开...');
                // 查找侧边栏的折叠/展开按钮
                const toggleButtons = await page.$$('button[type="text"]');
                for (const btn of toggleButtons) {
                    const icon = await page.evaluate(el => {
                        const iconEl = el.querySelector('.anticon');
                        return iconEl?.className || '';
                    }, btn);
                    if (icon.includes('menu-unfold') || icon.includes('menu-fold')) {
                        await btn.click();
                        await wait(300);
                        break;
                    }
                }
            }
        }
    } catch (error) {
        console.log('   ⚠️ 无法检查侧边栏状态:', error.message);
    }
    
    // 等待菜单加载
    await wait(500);
    
    // 递归展开所有子菜单
    console.log('   📂 展开所有子菜单...');
    await page.evaluate(() => {
        // 查找所有未展开的子菜单并展开
        const submenuTitles = document.querySelectorAll('.ant-menu-submenu-title');
        submenuTitles.forEach((title) => {
            const submenu = title.closest('.ant-menu-submenu');
            if (submenu && !submenu.classList.contains('ant-menu-submenu-open')) {
                title.click();
            }
        });
    });
    
    await wait(800);
    
    // 获取所有可点击的菜单项（只获取最终的可点击项，不包括子菜单标题）
    const menuItems = await page.evaluate(() => {
        const items = [];
        const seenTexts = new Set();
        
        // 递归查找所有菜单项
        const findMenuItems = (container) => {
            // 查找所有可点击的菜单项（不包括子菜单标题）
            const menuItems = container.querySelectorAll('.ant-menu-item:not(.ant-menu-item-disabled)');
            
            menuItems.forEach((item) => {
                const text = item.textContent?.trim();
                if (text && text.length > 0 && !seenTexts.has(text)) {
                    seenTexts.add(text);
                    const key = item.getAttribute('data-menu-id') || 
                               item.getAttribute('data-key') || 
                               `item-${items.length}`;
                    items.push({ key, text, type: 'item' });
                }
            });
            
            // 查找所有子菜单容器，递归查找其中的菜单项
            const submenus = container.querySelectorAll('.ant-menu-submenu');
            submenus.forEach((submenu) => {
                const submenuContent = submenu.querySelector('.ant-menu');
                if (submenuContent) {
                    findMenuItems(submenuContent);
                }
            });
        };
        
        const menuContainer = document.querySelector('.ant-menu');
        if (menuContainer) {
            findMenuItems(menuContainer);
        }
        
        return items;
    });
    
    console.log(`   ✅ 找到 ${menuItems.length} 个可点击的菜单项`);
    return menuItems;
}

/**
 * 点击菜单项
 */
async function clickMenuItem(page, menuItem, index, total) {
    console.log(`\n   [${index + 1}/${total}] 点击菜单: "${menuItem.text}"`);
    
    try {
        const beforeUrl = page.url();
        
        // 方法1: 通过文本内容精确匹配查找菜单项
        const clicked = await page.evaluate((text) => {
            // 查找所有菜单项
            const menuItems = Array.from(document.querySelectorAll('.ant-menu-item:not(.ant-menu-item-disabled)'));
            
            for (const item of menuItems) {
                const itemText = item.textContent?.trim();
                if (itemText === text) {
                    // 滚动到可见区域
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // 点击菜单项
                    item.click();
                    return { success: true };
                }
            }
            return { success: false, reason: 'not found' };
        }, menuItem.text);
        
        if (!clicked.success) {
            // 方法2: 尝试通过 XPath 查找（模糊匹配）
            try {
                const xpath = `//li[contains(@class, 'ant-menu-item') and contains(., '${menuItem.text}')]`;
                const elements = await page.$x(xpath);
                if (elements.length > 0) {
                    await elements[0].click();
                } else {
                    throw new Error(`无法找到菜单项: ${menuItem.text}`);
                }
            } catch (xpathError) {
                throw new Error(`无法找到菜单项: ${menuItem.text}`);
            }
        }
        
        await wait(500);
        
        // 等待页面加载或导航
        try {
            await Promise.race([
                page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 3000 }).catch(() => null),
                page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 3000 }).catch(() => null),
                wait(2000)
            ]);
        } catch (error) {
            // 忽略导航超时
        }
        
        await wait(800);
        
        // 检查页面是否正常加载
        const currentUrl = page.url();
        const pageTitle = await page.title();
        
        // 检查是否有错误提示
        const hasError = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('.ant-message-error, .ant-alert-error');
            if (errorElements.length > 0) {
                return true;
            }
            // 检查页面内容是否包含错误信息
            const bodyText = document.body.textContent || '';
            return bodyText.includes('登录失败') || 
                   bodyText.includes('用户名或密码错误') ||
                   bodyText.includes('页面加载失败');
        });
        
        // 判断是否成功：URL变化了且没有错误，或者URL没变但页面内容正常
        const urlChanged = currentUrl !== beforeUrl;
        const isLoginPage = currentUrl.includes('/login');
        const hasContent = await page.evaluate(() => {
            return document.body.textContent && document.body.textContent.length > 100;
        });
        
        const success = !isLoginPage && !hasError && (urlChanged || hasContent);
        
        const result = {
            menu: menuItem.text,
            url: currentUrl,
            title: pageTitle,
            success: success
        };
        
        if (result.success) {
            console.log(`      ✅ 成功 - URL: ${currentUrl}`);
            recordTest(`菜单: ${menuItem.text}`, true, currentUrl);
        } else {
            const reason = isLoginPage ? '跳转到登录页' : 
                          hasError ? '页面有错误提示' : 
                          !urlChanged ? 'URL未变化' : '未知原因';
            console.log(`      ⚠️ 可能有问题 - URL: ${currentUrl}, 原因: ${reason}`);
            recordTest(`菜单: ${menuItem.text}`, false, reason);
        }
        
        testResults.menuResults.push(result);
        return result;
        
    } catch (error) {
        console.log(`      ❌ 失败: ${error.message}`);
        recordTest(`菜单: ${menuItem.text}`, false, error.message);
        testResults.menuResults.push({
            menu: menuItem.text,
            url: page.url(),
            title: await page.title(),
            success: false,
            error: error.message
        });
        return { success: false, error: error.message };
    }
}

/**
 * 主测试函数
 */
async function testMenuNavigation() {
    console.log('🚀 开始菜单导航测试');
    console.log('='.repeat(60));
    console.log(`📋 测试配置:`);
    console.log(`   基础URL: ${UNIFIED_CONFIG.server.baseUrl}`);
    console.log(`   用户名: ${UNIFIED_CONFIG.login.username}`);
    console.log(`   密码: ${'*'.repeat(UNIFIED_CONFIG.login.password.length)}`);
    console.log('='.repeat(60));
    console.log('');

    let browser = null;
    let page = null;

    try {
        // 启动浏览器
        console.log('📦 启动浏览器...');
        const browserConfig = {
            headless: UNIFIED_CONFIG.browser.headless,
            slowMo: UNIFIED_CONFIG.browser.slowMo,
            args: UNIFIED_CONFIG.browser.args
        };
        
        if (UNIFIED_CONFIG.browser.executablePath) {
            browserConfig.executablePath = UNIFIED_CONFIG.browser.executablePath;
            console.log(`   使用浏览器: ${UNIFIED_CONFIG.browser.executablePath}`);
        } else {
            console.log('   使用 puppeteer 自带的 Chromium');
        }
        
        browser = await puppeteer.launch(browserConfig);
        page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        page.setDefaultTimeout(UNIFIED_CONFIG.timeouts.default);

        // 监听控制台输出
        page.on('console', msg => {
            const type = msg.type();
            if (type === 'error') {
                console.log(`   🔴 浏览器控制台错误: ${msg.text()}`);
            }
        });

        // 监听页面错误
        page.on('pageerror', error => {
            console.log(`   🔴 页面错误: ${error.message}`);
        });

        console.log('✅ 浏览器启动成功\n');

        // 1. 登录
        const loginSuccess = await login(page);
        if (!loginSuccess) {
            throw new Error('登录失败，无法继续测试');
        }
        console.log('');

        // 2. 获取所有菜单项
        const menuItems = await getAllMenuItems(page);
        if (menuItems.length === 0) {
            throw new Error('未找到任何菜单项');
        }
        console.log('');

        // 3. 遍历所有菜单项
        console.log('🔄 步骤 3: 遍历所有菜单项...');
        console.log(`   共 ${menuItems.length} 个菜单项需要测试\n`);

        for (let i = 0; i < menuItems.length; i++) {
            await clickMenuItem(page, menuItems[i], i, menuItems.length);
            
            // 在菜单项之间稍作等待
            if (i < menuItems.length - 1) {
                await wait(300);
            }
        }

        console.log('');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('   错误堆栈:', error.stack);
        recordTest('测试执行', false, error.message);

        // 如果页面存在，截图保存
        if (page) {
            try {
                await page.screenshot({ path: 'backend/test/puppeteer/menu-navigation-error.png', fullPage: true });
                console.log('   📸 已保存错误截图: backend/test/puppeteer/menu-navigation-error.png');
            } catch (screenshotError) {
                // 忽略截图错误
            }
        }
    } finally {
        // 关闭浏览器
        if (browser) {
            await browser.close();
            console.log('🔒 浏览器已关闭');
        }
    }

    // 输出测试总结
    console.log('');
    console.log('='.repeat(60));
    console.log('📊 测试总结:');
    console.log(`   总测试数: ${testResults.total}`);
    console.log(`   ✅ 通过: ${testResults.passed}`);
    console.log(`   ❌ 失败: ${testResults.failed}`);
    console.log(`   通过率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    console.log('');
    console.log('📋 菜单测试详情:');
    const successCount = testResults.menuResults.filter(r => r.success).length;
    const failCount = testResults.menuResults.filter(r => !r.success).length;
    console.log(`   成功: ${successCount} 个`);
    console.log(`   失败: ${failCount} 个`);
    if (failCount > 0) {
        console.log('');
        console.log('   失败的菜单:');
        testResults.menuResults.filter(r => !r.success).forEach(r => {
            console.log(`     - ${r.menu}: ${r.error || '未知错误'}`);
        });
    }
    console.log('='.repeat(60));

    return testResults.failed === 0;
}

// 运行测试
testMenuNavigation()
    .then(success => {
        if (success) {
            console.log('🎉 所有测试通过！');
            process.exit(0);
        } else {
            console.log('❌ 部分测试失败！');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('💥 测试执行异常:', error);
        process.exit(1);
    });

