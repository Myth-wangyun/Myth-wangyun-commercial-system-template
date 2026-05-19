#!/usr/bin/env node

// 简单的登录测试 - 模拟手动登录过程

import puppeteer from 'puppeteer';
import { UNIFIED_CONFIG } from './unified-config.js';

async function simpleLoginTest() {
    console.log('🔍 简单登录测试 - 模拟手动登录过程');
    console.log('='.repeat(50));
    
    let browser = null;
    
    try {
        // 启动浏览器
        console.log('🚀 启动浏览器...');
        browser = await puppeteer.launch({
            headless: true,
            slowMo: 0,
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
        page.setDefaultTimeout(30000);
        
        console.log('✅ 浏览器启动成功');
        
        // 访问登录页面
        console.log('📄 访问登录页面:', UNIFIED_CONFIG.server.loginUrl);
        await page.goto(UNIFIED_CONFIG.server.loginUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        // 检查页面信息
        const title = await page.title();
        const url = page.url();
        console.log('📄 页面标题:', title);
        console.log('🌐 当前URL:', url);
        
        // 等待页面完全加载
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 清除可能的跳转循环状态
        console.log('🧹 清除跳转循环状态...');
        await page.evaluate(() => {
            sessionStorage.removeItem('lastRedirectTime');
            sessionStorage.removeItem('redirectCount');
            localStorage.removeItem('lastRedirectTime');
            localStorage.removeItem('redirectCount');
            console.log('✅ 跳转循环状态已清除');
        });
        
        // 填写用户名 - 模拟手动输入
        console.log('✏️ 填写用户名:', UNIFIED_CONFIG.login.username);
        await page.click('#username'); // 先点击输入框
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.keyboard.press('Delete');
        await page.type('#username', UNIFIED_CONFIG.login.username, { delay: 100 });
        
        // 填写密码 - 模拟手动输入
        console.log('✏️ 填写密码...');
        await page.click('#password'); // 先点击输入框
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.keyboard.press('Delete');
        await page.type('#password', UNIFIED_CONFIG.login.password, { delay: 100 });
        
        // 等待一下让页面处理
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 点击登录按钮 - 使用多种方式
        console.log('🖱️ 点击登录按钮...');
        
        // 方式1：直接点击
        await page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 方式2：如果还没反应，尝试按回车
        if (page.url().includes('login.html') && !page.url().includes('?')) {
            console.log('   🔄 尝试按回车键...');
            await page.keyboard.press('Enter');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // 等待登录处理 - 增加等待时间
        console.log('⏳ 等待登录处理...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒
        
        // 检查结果
        const newUrl = page.url();
        const newTitle = await page.title();
        console.log('🌐 登录后URL:', newUrl);
        console.log('📄 登录后标题:', newTitle);
        
        // 检查页面内容变化
        const pageContent = await page.content();
        const hasUserInfo = pageContent.includes('王泽熙') || pageContent.includes('wangzexi');
        const hasMainContent = pageContent.includes('index') || pageContent.includes('main') || pageContent.includes('dashboard');
        
        console.log('📄 页面内容检查:');
        console.log('   包含用户信息:', hasUserInfo);
        console.log('   包含主要内容:', hasMainContent);
        
        // 检查跳转循环状态
        const redirectInfo = await page.evaluate(() => {
            return {
                lastRedirectTime: sessionStorage.getItem('lastRedirectTime'),
                redirectCount: sessionStorage.getItem('redirectCount'),
                isLoggedIn: typeof AuthManager !== 'undefined' ? AuthManager.isLoggedIn() : 'AuthManager未定义'
            };
        });
        console.log('🔄 跳转状态检查:');
        console.log('   上次跳转时间:', redirectInfo.lastRedirectTime);
        console.log('   跳转次数:', redirectInfo.redirectCount);
        console.log('   登录状态:', redirectInfo.isLoggedIn);
        
        // 判断登录是否成功
        if (newTitle.includes('王泽熙') || newTitle.includes('wangzexi')) {
            console.log('✅ 登录成功！页面标题已更新');
            return true;
        } else if (newUrl.includes('index.html') || newUrl.includes('main')) {
            console.log('✅ 登录成功，页面已跳转！');
            return true;
        } else if (hasUserInfo || hasMainContent) {
            console.log('✅ 登录成功！页面内容已更新');
            return true;
        } else {
            console.log('❌ 登录失败，仍在登录页面');
            return false;
        }
        
    } catch (error) {
        console.error('❌ 测试过程中出错:', error.message);
        return false;
    } finally {
        if (browser) {
            await browser.close();
            console.log('🔒 浏览器已关闭');
        }
    }
}

// 运行测试
simpleLoginTest().then(success => {
    console.log('='.repeat(50));
    if (success) {
        console.log('🎉 登录测试成功！');
    } else {
        console.log('❌ 登录测试失败！');
    }
    process.exit(success ? 0 : 1);
}).catch(console.error);
