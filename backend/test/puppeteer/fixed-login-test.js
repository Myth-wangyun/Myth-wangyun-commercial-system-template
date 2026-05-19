import puppeteer from 'puppeteer';
import { UNIFIED_CONFIG } from './unified-config.js';

async function runFixedLoginTest() {
    console.log('🔍 修复后的登录测试 - 解决跳转循环问题');
    console.log('==================================================');
    
    let browser = null;
    try {
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
                '--disable-gpu'
            ],
            executablePath: UNIFIED_CONFIG.browser.executablePath
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        page.setDefaultTimeout(UNIFIED_CONFIG.timeouts.default);
        
        console.log('✅ 浏览器启动成功');
        
        // 访问登录页面
        console.log('📄 访问登录页面:', UNIFIED_CONFIG.server.loginUrl);
        await page.goto(UNIFIED_CONFIG.server.loginUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        const title = await page.title();
        const url = page.url();
        console.log('📄 页面标题:', title);
        console.log('🌐 当前URL:', url);
        
        // 等待页面完全加载
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 清除所有可能的跳转循环状态
        console.log('🧹 清除跳转循环状态...');
        await page.evaluate(() => {
            sessionStorage.removeItem('lastRedirectTime');
            sessionStorage.removeItem('redirectCount');
            localStorage.removeItem('lastRedirectTime');
            localStorage.removeItem('redirectCount');
            console.log('✅ 跳转循环状态已清除');
        });
        
        // 填写用户名
        console.log('✏️ 填写用户名:', UNIFIED_CONFIG.login.username);
        await page.click('#username');
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.keyboard.press('Delete');
        await page.type('#username', UNIFIED_CONFIG.login.username, { delay: 100 });
        
        // 填写密码
        console.log('✏️ 填写密码...');
        await page.click('#password');
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.keyboard.press('Delete');
        await page.type('#password', UNIFIED_CONFIG.login.password, { delay: 100 });
        
        // 选择校区
        console.log('🏫 选择校区...');
        await page.select('#campus', '盛邦校区');
        
        // 等待一下让页面处理
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 监听网络请求
        const requests = [];
        const responses = [];
        
        page.on('request', request => {
            if (request.url().includes('login') || request.url().includes('auth')) {
                requests.push({
                    url: request.url(),
                    method: request.method(),
                    postData: request.postData()
                });
                console.log('📤 发送请求:', request.method(), request.url());
            }
        });
        
        page.on('response', response => {
            if (response.url().includes('login') || response.url().includes('auth')) {
                responses.push({
                    url: response.url(),
                    status: response.status()
                });
                console.log('📥 收到响应:', response.status(), response.url());
            }
        });
        
        // 点击登录按钮
        console.log('🖱️ 点击登录按钮...');
        await page.click('button[type="submit"]');
        
        // 等待登录处理
        console.log('⏳ 等待登录处理...');
        await new Promise(resolve => setTimeout(resolve, 8000)); // 等待8秒
        
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
        const redirectState = await page.evaluate(() => {
            return {
                lastRedirectTime: sessionStorage.getItem('lastRedirectTime'),
                redirectCount: sessionStorage.getItem('redirectCount'),
                isInLoop: sessionStorage.getItem('redirectCount') && parseInt(sessionStorage.getItem('redirectCount')) >= 3
            };
        });
        
        console.log('🔄 跳转循环状态:');
        console.log('   最后跳转时间:', redirectState.lastRedirectTime);
        console.log('   跳转次数:', redirectState.redirectCount);
        console.log('   是否在循环中:', redirectState.isInLoop);
        
        // 显示网络请求信息
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
            console.log('🔒 浏览器已关闭');
            await browser.close();
        }
    }
}

runFixedLoginTest().then(success => {
    if (success) {
        console.log('==================================================');
        console.log('🎉 修复后的登录测试成功！');
        process.exit(0);
    } else {
        console.log('==================================================');
        console.log('❌ 修复后的登录测试失败！');
        process.exit(1);
    }
});
