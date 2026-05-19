#!/usr/bin/env node

// 仅测试登录流程的脚本
// 用于调试登录问题

import puppeteer from 'puppeteer';
import { UNIFIED_CONFIG } from './unified-config.js';

async function testLoginOnly() {
    console.log('🔍 开始测试登录流程...');
    console.log('='.repeat(50));
    
    let browser = null;
    
    try {
        // 启动浏览器
        console.log('🚀 启动浏览器...');
        browser = await puppeteer.launch({
            headless: true, // 使用无头模式
            slowMo: 0, // 无延迟，快速执行
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ],
            executablePath: UNIFIED_CONFIG.browser.executablePath
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        page.setDefaultTimeout(UNIFIED_CONFIG.timeouts.default);
        
        // 监听网络请求
        const requests = [];
        const responses = [];
        
        page.on('request', request => {
            if (request.url().includes('login') || request.url().includes('auth')) {
                requests.push({
                    url: request.url(),
                    method: request.method(),
                    headers: request.headers(),
                    postData: request.postData()
                });
                console.log('📤 发送请求:', request.method(), request.url());
            }
        });
        
        page.on('response', response => {
            if (response.url().includes('login') || response.url().includes('auth')) {
                responses.push({
                    url: response.url(),
                    status: response.status(),
                    headers: response.headers()
                });
                console.log('📥 收到响应:', response.status(), response.url());
            }
        });
        
        console.log('✅ 浏览器启动成功');
        
        // 访问登录页面
        console.log('📄 访问登录页面:', UNIFIED_CONFIG.server.loginUrl);
        await page.goto(UNIFIED_CONFIG.server.loginUrl, { 
            waitUntil: 'domcontentloaded', // 改为更宽松的等待条件
            timeout: 30000 // 增加超时时间到30秒
        });
        
        // 检查页面信息
        const title = await page.title();
        const url = page.url();
        console.log('📄 页面标题:', title);
        console.log('🌐 当前URL:', url);
        
        // 检查页面元素
        const usernameExists = await page.$('#username');
        const passwordExists = await page.$('#password');
        const submitExists = await page.$('button[type="submit"]');
        
        console.log('🔍 页面元素检查:');
        console.log('  用户名输入框:', usernameExists ? '✅ 存在' : '❌ 不存在');
        console.log('  密码输入框:', passwordExists ? '✅ 存在' : '❌ 不存在');
        console.log('  提交按钮:', submitExists ? '✅ 存在' : '❌ 不存在');
        
            // 如果元素存在，尝试填写
            if (usernameExists && passwordExists && submitExists) {
                console.log('✏️ 填写登录信息...');
                console.log('   用户名:', UNIFIED_CONFIG.login.username);
                console.log('   密码:', UNIFIED_CONFIG.login.password);
                
                // 清空输入框并重新填写
                await page.evaluate(() => {
                    document.querySelector('#username').value = '';
                    document.querySelector('#password').value = '';
                });
                
                await page.type('#username', UNIFIED_CONFIG.login.username);
                await page.type('#password', UNIFIED_CONFIG.login.password);
                
                // 验证填写的内容
                const filledUsername = await page.$eval('#username', el => el.value);
                const filledPassword = await page.$eval('#password', el => el.value);
                console.log('   已填写的用户名:', filledUsername);
                console.log('   已填写的密码:', filledPassword ? '***已填写***' : '未填写');
                
                // 检查登录按钮的详细信息
                const submitButton = await page.$('button[type="submit"]');
                const buttonText = await page.$eval('button[type="submit"]', el => el.textContent);
                const buttonDisabled = await page.$eval('button[type="submit"]', el => el.disabled);
                console.log('   登录按钮文本:', buttonText);
                console.log('   登录按钮是否禁用:', buttonDisabled);
                
                console.log('🖱️ 点击登录按钮...');
                
                // 尝试多种提交方式
                try {
                    // 方式1：直接点击登录按钮
                    await page.click('button[type="submit"]');
                    console.log('   ✅ 按钮点击成功');
                } catch (error) {
                    console.log('   ❌ 按钮点击失败:', error.message);
                }
                
                // 等待一下看看是否有请求
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 如果还没有请求，尝试其他方式
                if (requests.length <= 2) {
                    console.log('   🔄 尝试按回车键提交...');
                    await page.keyboard.press('Enter');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                // 如果还是没有请求，尝试JavaScript提交表单
                if (requests.length <= 2) {
                    console.log('   🔄 尝试JavaScript提交表单...');
                    await page.evaluate(() => {
                        const form = document.querySelector('form');
                        if (form) {
                            form.submit();
                        } else {
                            document.querySelector('button[type="submit"]').click();
                        }
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                // 如果还是没有请求，尝试直接发送请求
                if (requests.length <= 2) {
                    console.log('   🔄 尝试直接发送登录请求...');
                    try {
                        await page.evaluate(async () => {
                            const username = document.querySelector('#username').value;
                            const password = document.querySelector('#password').value;
                            
                            const response = await fetch('/api/v1/auth/login', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ username, password })
                            });
                            
                            const result = await response.json();
                            console.log('登录响应:', result);
                        });
                    } catch (error) {
                        console.log('   直接请求失败:', error.message);
                    }
                }
                
                // 等待处理
                console.log('⏳ 等待登录处理...');
                await new Promise(resolve => setTimeout(resolve, 5000)); // 增加到5秒
                
                // 检查结果
                const newUrl = page.url();
                const newTitle = await page.title();
                console.log('🌐 登录后URL:', newUrl);
                console.log('📄 登录后标题:', newTitle);
                
                // 检查错误信息
                const errorElement = await page.$('.error, .alert-danger, [class*="error"], .alert, .message');
                if (errorElement) {
                    const errorText = await errorElement.textContent();
                    console.log('❌ 登录错误:', errorText);
                } else {
                    console.log('✅ 未发现错误信息');
                }
                
                // 检查页面内容变化
                const pageContent = await page.content();
                if (pageContent.includes('用户名或密码错误') || pageContent.includes('登录失败')) {
                    console.log('❌ 页面内容显示登录失败');
                }
                
                // 尝试其他可能的用户名密码组合
                console.log('');
                console.log('🔄 尝试其他用户名密码组合...');
                
                // 尝试 admin/admin123
                await page.evaluate(() => {
                    document.querySelector('#username').value = '';
                    document.querySelector('#password').value = '';
                });
                await page.type('#username', 'admin');
                await page.type('#password', 'admin123');
                await page.click('button[type="submit"]');
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const adminUrl = page.url();
                const adminTitle = await page.title();
                console.log('   尝试 admin/admin123:');
                console.log('   URL:', adminUrl);
                console.log('   标题:', adminTitle);
                
            } else {
                console.log('❌ 页面元素不完整，无法进行登录测试');
            }
        
        // 显示网络请求信息
        console.log('');
        console.log('📊 网络请求统计:');
        console.log('   发送的请求数量:', requests.length);
        console.log('   收到的响应数量:', responses.length);
        
        if (requests.length > 0) {
            console.log('📤 请求详情:');
            requests.forEach((req, index) => {
                console.log(`   ${index + 1}. ${req.method} ${req.url}`);
                if (req.postData) {
                    console.log(`      数据: ${req.postData}`);
                }
            });
        }
        
        if (responses.length > 0) {
            console.log('📥 响应详情:');
            responses.forEach((res, index) => {
                console.log(`   ${index + 1}. ${res.status} ${res.url}`);
            });
        }
        
        // 等待用户观察
        console.log('⏳ 等待5秒供观察...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
    } catch (error) {
        console.error('❌ 测试过程中出错:', error.message);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🔒 浏览器已关闭');
        }
    }
    
    console.log('='.repeat(50));
    console.log('🎉 登录测试完成！');
}

// 运行测试
testLoginOnly().catch(console.error);
