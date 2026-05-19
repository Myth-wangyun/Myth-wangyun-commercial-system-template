#!/usr/bin/env node

/**
 * 登录页面功能测试脚本
 * 测试登录页面的完整功能，包括：
 * - 页面加载
 * - 表单填写
 * - 登录提交
 * - 登录成功验证
 */

import puppeteer from 'puppeteer';
import { UNIFIED_CONFIG } from './unified-config.js';

// 测试结果统计
const testResults = {
    passed: 0,
    failed: 0,
    total: 0
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
 * 等待元素出现
 */
async function waitForElement(page, selector, timeout = 5000) {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * 等待指定时间（替代已弃用的 page.waitForTimeout）
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 主测试函数
 */
async function testLoginPage() {
    console.log('🚀 开始登录页面功能测试');
    console.log('='.repeat(60));
    console.log(`📋 测试配置:`);
    console.log(`   登录URL: ${UNIFIED_CONFIG.server.baseUrl}/login`);
    console.log(`   用户名: ${UNIFIED_CONFIG.login.username}`);
    console.log(`   密码: ${'*'.repeat(UNIFIED_CONFIG.login.password.length)}`);
    console.log('='.repeat(60));
    console.log('');

    let browser = null;
    let page = null;

    try {
        // 1. 启动浏览器
        console.log('📦 步骤 1: 启动浏览器...');
        const browserConfig = {
            headless: UNIFIED_CONFIG.browser.headless,
            slowMo: UNIFIED_CONFIG.browser.slowMo,
            args: UNIFIED_CONFIG.browser.args
        };
        
        // 如果配置了浏览器路径，则使用它；否则使用 puppeteer 自带的 Chromium
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

        recordTest('浏览器启动', true);
        console.log('');

        // 2. 访问登录页面
        console.log('📄 步骤 2: 访问登录页面...');
        const loginUrl = `${UNIFIED_CONFIG.server.baseUrl}/login`;
        console.log(`   访问URL: ${loginUrl}`);

        try {
            await page.goto(loginUrl, {
                waitUntil: 'networkidle2',
                timeout: UNIFIED_CONFIG.timeouts.navigation
            });

            const currentUrl = page.url();
            const pageTitle = await page.title();
            console.log(`   当前URL: ${currentUrl}`);
            console.log(`   页面标题: ${pageTitle}`);

            recordTest('访问登录页面', true, `URL: ${currentUrl}`);
        } catch (error) {
            recordTest('访问登录页面', false, error.message);
            throw error;
        }
        console.log('');

        // 3. 检查页面元素
        console.log('🔍 步骤 3: 检查页面元素...');

        // 等待页面加载完成
        await wait(2000);

        // 检查用户名输入框（Ant Design的Input组件）
        const usernameSelectors = [
            'input[name="username"]',
            'input[placeholder*="用户名"]',
            'input[placeholder*="用户"]',
            '.ant-input[placeholder*="用户名"]',
            '#username'
        ];

        let usernameInput = null;
        for (const selector of usernameSelectors) {
            usernameInput = await page.$(selector);
            if (usernameInput) {
                console.log(`   ✅ 找到用户名输入框: ${selector}`);
                break;
            }
        }

        // 检查密码输入框
        const passwordSelectors = [
            'input[name="password"]',
            'input[type="password"]',
            'input[placeholder*="密码"]',
            '.ant-input-password input',
            '#password'
        ];

        let passwordInput = null;
        for (const selector of passwordSelectors) {
            passwordInput = await page.$(selector);
            if (passwordInput) {
                console.log(`   ✅ 找到密码输入框: ${selector}`);
                break;
            }
        }

        // 检查登录按钮 - 使用 Puppeteer 支持的方法
        let submitButton = null;
        
        // 方法1: 尝试通过 type="submit" 查找
        try {
            const submitButtons = await page.$$('button[type="submit"]');
            if (submitButtons.length > 0) {
                submitButton = submitButtons[0];
                console.log('   ✅ 找到登录按钮: button[type="submit"]');
            }
        } catch (error) {
            // 忽略错误，继续尝试其他方法
        }
        
        // 方法2: 如果没找到，尝试通过 Ant Design 的类名查找
        if (!submitButton) {
            try {
                const primaryButtons = await page.$$('button.ant-btn-primary');
                for (const btn of primaryButtons) {
                    const text = await page.evaluate(el => el.textContent?.trim(), btn);
                    if (text && (text.includes('登录') || text.includes('Login'))) {
                        submitButton = btn;
                        console.log('   ✅ 找到登录按钮: button.ant-btn-primary');
                        break;
                    }
                }
            } catch (error) {
                // 忽略错误，继续尝试其他方法
            }
        }
        
        // 方法3: 如果还没找到，查找所有按钮并检查文本
        if (!submitButton) {
            try {
                const allButtons = await page.$$('button');
                for (const btn of allButtons) {
                    const text = await page.evaluate(el => el.textContent?.trim(), btn);
                    if (text && (text.includes('登录') || text.includes('Login'))) {
                        submitButton = btn;
                        console.log('   ✅ 找到登录按钮: 通过文本匹配');
                        break;
                    }
                }
            } catch (error) {
                // 忽略错误
            }
        }

        recordTest('页面元素检查', usernameInput && passwordInput && submitButton,
            `用户名: ${usernameInput ? '✅' : '❌'}, 密码: ${passwordInput ? '✅' : '❌'}, 按钮: ${submitButton ? '✅' : '❌'}`);

        if (!usernameInput || !passwordInput || !submitButton) {
            // 输出页面HTML以便调试
            const bodyHTML = await page.evaluate(() => document.body.innerHTML);
            console.log('   📄 页面HTML片段（用于调试）:');
            console.log('   ' + bodyHTML.substring(0, 500) + '...');
            throw new Error('页面元素不完整');
        }
        console.log('');

        // 4. 填写登录表单
        console.log('✏️ 步骤 4: 填写登录表单...');

        // 填写用户名 - 使用更可靠的方法
        console.log(`   填写用户名: ${UNIFIED_CONFIG.login.username}`);
        await usernameInput.click();
        await wait(200);
        // 清空输入框
        await page.evaluate((el) => {
            el.value = '';
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }, usernameInput);
        await wait(100);
        // 输入用户名
        await usernameInput.type(UNIFIED_CONFIG.login.username, { delay: 50 });
        await wait(300);

        // 验证用户名是否填写成功
        const filledUsername = await page.evaluate((el) => el.value, usernameInput);
        recordTest('填写用户名', filledUsername === UNIFIED_CONFIG.login.username,
            `期望: ${UNIFIED_CONFIG.login.username}, 实际: ${filledUsername}`);

        // 填写密码 - 使用更可靠的方法
        console.log(`   填写密码: ${'*'.repeat(UNIFIED_CONFIG.login.password.length)}`);
        await passwordInput.click();
        await wait(200);
        // 清空输入框
        await page.evaluate((el) => {
            el.value = '';
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }, passwordInput);
        await wait(100);
        // 输入密码
        await passwordInput.type(UNIFIED_CONFIG.login.password, { delay: 50 });
        await wait(300);

        // 验证密码是否填写成功（密码字段可能无法直接读取值）
        const filledPassword = await page.evaluate((el) => el.value, passwordInput);
        recordTest('填写密码', filledPassword.length > 0,
            `密码长度: ${filledPassword.length}`);

        await wait(500);
        console.log('');

        // 5. 提交登录表单
        console.log('🖱️ 步骤 5: 提交登录表单...');

        // 监听导航事件
        const navigationPromise = Promise.race([
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => null),
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null),
            wait(10000) // 最多等待10秒
        ]);

        // 点击登录按钮
        await submitButton.click();
        console.log('   ✅ 已点击登录按钮');

        // 等待导航或响应
        try {
            await navigationPromise;
            console.log('   ✅ 页面导航完成');
        } catch (error) {
            // 导航超时不算错误，可能页面已经更新
            console.log('   ⚠️ 导航等待超时，继续检查...');
        }

        // 额外等待一下，确保页面完全加载
        await wait(2000);

        recordTest('提交登录表单', true);
        console.log('');

        // 6. 验证登录结果
        console.log('🔍 步骤 6: 验证登录结果...');
        await wait(3000); // 等待登录处理

        const finalUrl = page.url();
        const finalTitle = await page.title();
        const pageContent = await page.content();

        console.log(`   最终URL: ${finalUrl}`);
        console.log(`   最终标题: ${finalTitle}`);

        // 检查是否跳转到首页
        const isRedirected = !finalUrl.includes('/login') && finalUrl !== loginUrl;
        console.log(`   是否跳转: ${isRedirected ? '✅ 是' : '❌ 否'}`);

        // 检查页面内容
        const hasUserInfo = pageContent.includes(UNIFIED_CONFIG.login.username) ||
                           pageContent.includes('王泽熙') ||
                           pageContent.includes('wangzexi');
        const hasMainContent = pageContent.includes('dashboard') ||
                              pageContent.includes('首页') ||
                              pageContent.includes('控制台') ||
                              pageContent.includes('清美教育');

        // 更精确地检查是否有错误消息 - 只检查可见的错误提示元素
        let hasError = false;
        let errorMessage = '';
        try {
            // 检查 Ant Design 的错误消息组件
            const errorElements = await page.$$('.ant-message-error, .ant-alert-error, .ant-notification-notice-error');
            if (errorElements.length > 0) {
                for (const el of errorElements) {
                    const text = await page.evaluate(e => e.textContent?.trim(), el);
                    if (text && (text.includes('登录失败') || text.includes('用户名或密码错误') || text.includes('密码错误'))) {
                        hasError = true;
                        errorMessage = text;
                        break;
                    }
                }
            }
            
            // 如果没有找到错误元素，检查页面中是否有明确的错误提示文本（但排除代码中的error）
            if (!hasError) {
                const visibleText = await page.evaluate(() => {
                    // 获取所有可见文本
                    const walker = document.createTreeWalker(
                        document.body,
                        NodeFilter.SHOW_TEXT,
                        null
                    );
                    const texts = [];
                    let node;
                    while (node = walker.nextNode()) {
                        const text = node.textContent?.trim();
                        if (text && text.length > 0 && text.length < 100) {
                            texts.push(text);
                        }
                    }
                    return texts.join(' ');
                });
                
                // 只检查明确的错误消息
                const errorPatterns = [
                    '登录失败',
                    '用户名或密码错误',
                    '密码错误',
                    '用户名错误',
                    '认证失败',
                    '登录失败，请稍后重试'
                ];
                
                for (const pattern of errorPatterns) {
                    if (visibleText.includes(pattern)) {
                        hasError = true;
                        errorMessage = pattern;
                        break;
                    }
                }
            }
        } catch (error) {
            // 如果检查错误时出错，忽略它
            console.log('   ⚠️ 检查错误消息时出错:', error.message);
        }

        console.log(`   包含用户信息: ${hasUserInfo ? '✅' : '❌'}`);
        console.log(`   包含主要内容: ${hasMainContent ? '✅' : '❌'}`);
        if (hasError) {
            console.log(`   包含错误信息: ❌ 是 (${errorMessage})`);
        } else {
            console.log(`   包含错误信息: ✅ 否`);
        }

        // 检查认证token（更可靠的登录成功指标）
        let hasAuthToken = false;
        try {
            const token = await page.evaluate(() => {
                return localStorage.getItem('token') || 
                       localStorage.getItem('access_token') ||
                       localStorage.getItem('authToken') ||
                       sessionStorage.getItem('token') ||
                       sessionStorage.getItem('access_token');
            });
            hasAuthToken = !!token;
            if (hasAuthToken) {
                console.log(`   认证Token: ✅ 存在`);
            } else {
                console.log(`   认证Token: ❌ 不存在`);
            }
        } catch (error) {
            // 忽略错误
        }

        // 综合判断登录是否成功
        // 优先级：1. 有认证token 2. 已跳转且不在登录页面 3. 包含用户信息和主要内容且无错误
        const loginSuccess = hasAuthToken || 
                            (isRedirected && !finalUrl.includes('/login')) || 
                            (hasUserInfo && hasMainContent && !hasError);

        if (loginSuccess) {
            let successReason = '';
            if (hasAuthToken) {
                successReason = '检测到认证Token';
            } else if (isRedirected && !finalUrl.includes('/login')) {
                successReason = '已成功跳转到首页';
            } else if (hasUserInfo && hasMainContent) {
                successReason = '页面包含用户信息和主要内容';
            }
            recordTest('登录成功验证', true, `登录成功 - ${successReason}`);
            console.log(`   🎉 登录测试成功！(${successReason})`);
        } else {
            recordTest('登录成功验证', false, '登录可能失败，请检查');
            console.log('   ⚠️ 登录状态不明确，请手动检查');
            console.log(`   调试信息: URL=${finalUrl}, 跳转=${isRedirected}, 用户信息=${hasUserInfo}, 主要内容=${hasMainContent}, 错误=${hasError}`);
        }

        console.log('');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('   错误堆栈:', error.stack);
        recordTest('测试执行', false, error.message);

        // 如果页面存在，截图保存
        if (page) {
            try {
                await page.screenshot({ path: 'backend/test/puppeteer/login-test-error.png', fullPage: true });
                console.log('   📸 已保存错误截图: backend/test/puppeteer/login-test-error.png');
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
    console.log('='.repeat(60));

    return testResults.failed === 0;
}

// 运行测试
testLoginPage()
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

