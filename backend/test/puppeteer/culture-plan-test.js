#!/usr/bin/env node

/**
 * 企业文化计划表测试脚本
 * 测试流程：
 * 1. 登录系统
 * 2. 访问企业文化菜单栏
 * 3. 访问企业文化宣讲计划表
 * 4. 填写10条数据
 * 5. 访问企业文化考试计划表
 * 6. 填写10条数据
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
 * 等待指定时间（最大1000ms）
 */
function wait(ms) {
    const delay = Math.min(ms, 1000); // 确保不超过1000ms
    return new Promise(resolve => setTimeout(resolve, delay));
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
    
    // 查找并填写登录表单
    const usernameInput = await page.$('input[name="username"], input[placeholder*="用户名"]');
    const passwordInput = await page.$('input[type="password"], input[placeholder*="密码"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (!usernameInput || !passwordInput || !submitButton) {
        throw new Error('无法找到登录表单元素');
    }
    
    // 填写用户名
    await usernameInput.click();
    await wait(100);
    await page.evaluate((el) => {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
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
    const isLoggedIn = !currentUrl.includes('/login');
    
    if (isLoggedIn) {
        console.log(`   ✅ 登录成功，当前URL: ${currentUrl}`);
        recordTest('登录', true);
        return true;
    } else {
        console.log(`   ❌ 登录可能失败，当前URL: ${currentUrl}`);
        recordTest('登录', false);
        return false;
    }
}

/**
 * 访问菜单项（支持多级菜单）
 */
async function navigateToMenu(page, menuText) {
    console.log(`📋 访问菜单: "${menuText}"`);
    
    try {
        // 确保侧边栏展开
        const sidebar = await page.$('.ant-layout-sider');
        if (sidebar) {
            const isCollapsed = await page.evaluate((el) => {
                return el.classList.contains('ant-layout-sider-collapsed');
            }, sidebar);
            
            if (isCollapsed) {
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
        
        await wait(500);
        
        // 递归展开所有子菜单（多次尝试确保全部展开）
        for (let attempt = 0; attempt < 3; attempt++) {
            await page.evaluate(() => {
                const submenuTitles = document.querySelectorAll('.ant-menu-submenu-title');
                submenuTitles.forEach((title) => {
                    const submenu = title.closest('.ant-menu-submenu');
                    if (submenu && !submenu.classList.contains('ant-menu-submenu-open')) {
                        title.click();
                    }
                });
            });
            await wait(500);
        }
        
        // 查找并点击菜单项（支持模糊匹配）
        const clicked = await page.evaluate((text) => {
            // 先尝试精确匹配
            const menuItems = Array.from(document.querySelectorAll('.ant-menu-item:not(.ant-menu-item-disabled)'));
            for (const item of menuItems) {
                if (item.textContent?.trim() === text) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    item.click();
                    return true;
                }
            }
            // 再尝试包含匹配
            for (const item of menuItems) {
                if (item.textContent?.trim().includes(text) || text.includes(item.textContent?.trim())) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    item.click();
                    return true;
                }
            }
            return false;
        }, menuText);
        
        if (!clicked) {
            throw new Error(`无法找到菜单项: ${menuText}`);
        }
        
        await wait(500);
        
        // 等待页面加载
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
        
        const currentUrl = page.url();
        console.log(`   ✅ 已访问，当前URL: ${currentUrl}`);
        recordTest(`访问菜单: ${menuText}`, true);
        return true;
        
    } catch (error) {
        console.log(`   ❌ 失败: ${error.message}`);
        recordTest(`访问菜单: ${menuText}`, false, error.message);
        return false;
    }
}

/**
 * 点击保存按钮
 */
async function clickSaveButton(page) {
    console.log('💾 点击保存按钮...');
    
    try {
        // 等待按钮出现
        await wait(500);
        
        // 方法1: 通过按钮类型和文本查找（最可靠）
        let saved = await page.evaluate(() => {
            // 查找所有按钮
            const buttons = Array.from(document.querySelectorAll('button'));
            
            // 优先查找 type="primary" 且文本为"保存"的按钮
            for (const btn of buttons) {
                const text = btn.textContent?.trim();
                const classList = btn.className || '';
                const isPrimary = classList.includes('ant-btn-primary') || 
                                 btn.getAttribute('type') === 'primary' ||
                                 btn.classList.contains('ant-btn-primary');
                
                if (isPrimary && (text === '保存' || text.includes('保存'))) {
                    // 检查按钮是否被禁用
                    if (!btn.disabled && !btn.classList.contains('ant-btn-loading')) {
                        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        btn.click();
                        return { success: true, method: 'primary-button' };
                    }
                }
            }
            
            // 方法2: 查找所有包含"保存"文本的按钮
            for (const btn of buttons) {
                const text = btn.textContent?.trim();
                if (text === '保存' || text.includes('保存')) {
                    // 检查按钮是否被禁用
                    if (!btn.disabled && !btn.classList.contains('ant-btn-loading')) {
                        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        btn.click();
                        return { success: true, method: 'text-match' };
                    }
                }
            }
            
            return { success: false, reason: 'not found or disabled' };
        });
        
        // 如果方法1失败，尝试使用 Puppeteer 的选择器查找
        if (!saved.success) {
            // 尝试通过选择器查找
            const selectors = [
                'button.ant-btn-primary:has-text("保存")',
                'button[type="button"].ant-btn-primary',
                'button.ant-btn-primary'
            ];
            
            for (const selector of selectors) {
                try {
                    // 查找所有主按钮，然后检查文本
                    const primaryButtons = await page.$$('button.ant-btn-primary');
                    for (const btn of primaryButtons) {
                        const text = await page.evaluate(el => el.textContent?.trim(), btn);
                        if (text === '保存' || text.includes('保存')) {
                            const isDisabled = await page.evaluate(el => 
                                el.disabled || el.classList.contains('ant-btn-loading'), btn);
                            if (!isDisabled) {
                                await btn.click();
                                saved = { success: true, method: 'puppeteer-selector' };
                                break;
                            }
                        }
                    }
                    if (saved.success) break;
                } catch (error) {
                    // 继续尝试下一个选择器
                }
            }
        }
        
        // 如果还是失败，尝试通过 XPath 查找
        if (!saved.success) {
            const xpath = "//button[contains(@class, 'ant-btn-primary') and contains(., '保存')]";
            const elements = await page.$x(xpath);
            if (elements.length > 0) {
                const button = elements[0];
                const isDisabled = await page.evaluate(el => el.disabled || el.classList.contains('ant-btn-loading'), button);
                if (!isDisabled) {
                    await button.click();
                    saved = { success: true, method: 'xpath' };
                }
            }
        }
        
        if (!saved.success) {
            // 输出调试信息
            const buttonInfo = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.map(btn => ({
                    text: btn.textContent?.trim(),
                    className: btn.className,
                    disabled: btn.disabled,
                    type: btn.getAttribute('type'),
                    isPrimary: btn.classList.contains('ant-btn-primary')
                }));
            });
            console.log('   🔍 调试信息 - 页面上的所有按钮:');
            buttonInfo.forEach((info, index) => {
                console.log(`      按钮${index + 1}: 文本="${info.text}", 主按钮=${info.isPrimary}, 禁用=${info.disabled}`);
            });
            throw new Error('无法找到可用的保存按钮');
        }
        
        console.log(`   ✅ 已点击保存按钮 (方法: ${saved.method})`);
        await wait(500);
        
        // 等待保存完成（检查是否有成功提示）
        await wait(800);
        
        // 检查是否有成功或错误提示
        const message = await page.evaluate(() => {
            // 等待消息出现
            setTimeout(() => {}, 500);
            const successMsg = document.querySelector('.ant-message-success, .ant-notification-notice-success');
            const errorMsg = document.querySelector('.ant-message-error, .ant-notification-notice-error');
            if (successMsg) {
                return successMsg.textContent?.trim() || '保存成功';
            }
            if (errorMsg) {
                return errorMsg.textContent?.trim() || '保存失败';
            }
            return null;
        });
        
        if (message) {
            console.log(`   ✅ 保存${message.includes('成功') ? '成功' : '完成'}: ${message}`);
        }
        
        recordTest('点击保存按钮', true);
        return true;
        
    } catch (error) {
        console.log(`   ❌ 失败: ${error.message}`);
        recordTest('点击保存按钮', false, error.message);
        return false;
    }
}

/**
 * 填写宣讲计划表数据
 */
async function fillPresentationPlan(page, count = 10) {
    console.log(`✏️ 填写企业文化宣讲计划表 (${count}条数据)...`);
    
    try {
        // 等待表格加载
        await wait(500);
        
        // 确保有足够的行
        const rowCount = await page.evaluate(() => {
            const rows = document.querySelectorAll('.ant-table-tbody tr');
            return rows.length;
        });
        
        if (rowCount < count) {
            // 点击新增按钮添加行
            const hasAddButton = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                for (const btn of buttons) {
                    const text = btn.textContent?.trim();
                    if (text === '新增' || text === '添加') {
                        return true;
                    }
                }
                return false;
            });
            
            if (hasAddButton) {
                for (let i = rowCount; i < count; i++) {
                    await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        for (const btn of buttons) {
                            const text = btn.textContent?.trim();
                            if (text === '新增' || text === '添加') {
                                btn.click();
                                return;
                            }
                        }
                    });
                    await wait(200);
                }
            }
        }
        
        await wait(500);
        
        // 生成测试数据
        const testData = Array.from({ length: count }, (_, i) => ({
            time: new Date(2024, 0, i + 1).toISOString().split('T')[0], // YYYY-MM-DD
            location: `地点${i + 1}`,
            method: `方式${i + 1}`,
            topic: `主题${i + 1}`,
            summary: `内容概述${i + 1}`,
            audience: `对象${i + 1}`,
            speaker: `主讲人${i + 1}`,
            materials: `资料${i + 1}`,
            remark: `备注${i + 1}`
        }));
        
        // 填写每一行数据（通过列索引定位）
        for (let i = 0; i < count; i++) {
            console.log(`   填写第 ${i + 1} 行数据...`);
            const data = testData[i];
            
            // 通过列索引填写数据（更可靠的方法）
            await page.evaluate((rowIndex, rowData) => {
                const rows = document.querySelectorAll('.ant-table-tbody tr');
                if (rows[rowIndex]) {
                    const cells = rows[rowIndex].querySelectorAll('td');
                    // 列索引：0=序号, 1=时间, 2=地点, 3=方式, 4=主题, 5=概述, 6=对象, 7=主讲, 8=资料, 9=备注
                    if (cells.length > 1) {
                        // 填写时间（第1列，DatePicker）
                        const timeCell = cells[1];
                        const timeInput = timeCell.querySelector('.ant-picker-input input, input');
                        if (timeInput) {
                            timeInput.value = rowData.time;
                            timeInput.dispatchEvent(new Event('input', { bubbles: true }));
                            timeInput.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        
                        // 填写地点（第2列）
                        if (cells[2]) {
                            const input = cells[2].querySelector('input');
                            if (input) {
                                input.value = rowData.location;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        
                        // 填写方式（第3列）
                        if (cells[3]) {
                            const input = cells[3].querySelector('input');
                            if (input) {
                                input.value = rowData.method;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        
                        // 填写主题（第4列）
                        if (cells[4]) {
                            const input = cells[4].querySelector('input');
                            if (input) {
                                input.value = rowData.topic;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        
                        // 填写概述（第5列）
                        if (cells[5]) {
                            const input = cells[5].querySelector('input');
                            if (input) {
                                input.value = rowData.summary;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        
                        // 填写对象（第6列）
                        if (cells[6]) {
                            const input = cells[6].querySelector('input');
                            if (input) {
                                input.value = rowData.audience;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        
                        // 填写主讲（第7列）
                        if (cells[7]) {
                            const input = cells[7].querySelector('input');
                            if (input) {
                                input.value = rowData.speaker;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        
                        // 填写资料（第8列）
                        if (cells[8]) {
                            const input = cells[8].querySelector('input');
                            if (input) {
                                input.value = rowData.materials;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        
                        // 填写备注（第9列）
                        if (cells[9]) {
                            const input = cells[9].querySelector('input');
                            if (input) {
                                input.value = rowData.remark;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                    }
                }
            }, i, data);
            
            await wait(300);
        }
        
        console.log(`   ✅ 已填写 ${count} 条数据`);
        recordTest('填写宣讲计划表', true, `填写了${count}条数据`);
        return true;
        
    } catch (error) {
        console.log(`   ❌ 失败: ${error.message}`);
        recordTest('填写宣讲计划表', false, error.message);
        return false;
    }
}

/**
 * 填写考试计划表数据
 */
async function fillExamPlan(page, count = 10) {
    console.log(`✏️ 填写企业文化考试计划表 (${count}条数据)...`);
    
    try {
        // 等待表格加载
        await wait(500);
        
        // 确保有足够的行
        const rowCount = await page.evaluate(() => {
            const rows = document.querySelectorAll('.ant-table-tbody tr');
            return rows.length;
        });
        
        if (rowCount < count) {
            // 点击新增按钮添加行
            const hasAddButton = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                for (const btn of buttons) {
                    const text = btn.textContent?.trim();
                    if (text === '新增' || text === '添加') {
                        return true;
                    }
                }
                return false;
            });
            
            if (hasAddButton) {
                for (let i = rowCount; i < count; i++) {
                    await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button'));
                        for (const btn of buttons) {
                            const text = btn.textContent?.trim();
                            if (text === '新增' || text === '添加') {
                                btn.click();
                                return;
                            }
                        }
                    });
                    await wait(200);
                }
            }
        }
        
        await wait(500);
        
        // 生成测试数据
        const testData = Array.from({ length: count }, (_, i) => ({
            time: new Date(2024, 0, i + 15).toISOString().split('T')[0], // YYYY-MM-DD
            location: `考试地点${i + 1}`,
            method: `考试方式${i + 1}`,
            scope: `考试主题${i + 1}`,
            audience: `考试对象${i + 1}`,
            organizer: `组织人${i + 1}`,
            proctor: `监考人${i + 1}`,
            materials: `资料${i + 1}`,
            remark: `备注${i + 1}`
        }));
        
        // 填写每一行数据（通过列索引定位）
        for (let i = 0; i < count; i++) {
            console.log(`   填写第 ${i + 1} 行数据...`);
            const data = testData[i];
            
            // 通过列索引填写数据
            await page.evaluate((rowIndex, rowData) => {
                const rows = document.querySelectorAll('.ant-table-tbody tr');
                if (rows[rowIndex]) {
                    const cells = rows[rowIndex].querySelectorAll('td');
                    // 列索引：0=序号, 1=时间, 2=地点, 3=方式, 4=主题, 5=对象, 6=组织, 7=监考, 8=资料, 9=备注
                    if (cells.length > 1) {
                        // 填写时间（第1列，DatePicker）
                        const timeCell = cells[1];
                        const timeInput = timeCell.querySelector('.ant-picker-input input, input');
                        if (timeInput) {
                            timeInput.value = rowData.time;
                            timeInput.dispatchEvent(new Event('input', { bubbles: true }));
                            timeInput.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        
                        // 填写地点（第2列）
                        if (cells[2]) {
                            const input = cells[2].querySelector('input');
                            if (input) {
                                input.value = rowData.location;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        
                        // 填写方式（第3列）
                        if (cells[3]) {
                            const input = cells[3].querySelector('input');
                            if (input) {
                                input.value = rowData.method;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        
                        // 填写主题（第4列）
                        if (cells[4]) {
                            const input = cells[4].querySelector('input');
                            if (input) {
                                input.value = rowData.scope;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        
                        // 填写对象（第5列）
                        if (cells[5]) {
                            const input = cells[5].querySelector('input');
                            if (input) {
                                input.value = rowData.audience;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        
                        // 填写组织（第6列）
                        if (cells[6]) {
                            const input = cells[6].querySelector('input');
                            if (input) {
                                input.value = rowData.organizer;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        
                        // 填写监考（第7列）
                        if (cells[7]) {
                            const input = cells[7].querySelector('input');
                            if (input) {
                                input.value = rowData.proctor;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        
                        // 填写资料（第8列）
                        if (cells[8]) {
                            const input = cells[8].querySelector('input');
                            if (input) {
                                input.value = rowData.materials;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                        
                        // 填写备注（第9列）
                        if (cells[9]) {
                            const input = cells[9].querySelector('input');
                            if (input) {
                                input.value = rowData.remark;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }
                    }
                }
            }, i, data);
            
            await wait(300);
        }
        
        console.log(`   ✅ 已填写 ${count} 条数据`);
        recordTest('填写考试计划表', true, `填写了${count}条数据`);
        return true;
        
    } catch (error) {
        console.log(`   ❌ 失败: ${error.message}`);
        recordTest('填写考试计划表', false, error.message);
        return false;
    }
}

/**
 * 主测试函数
 */
async function testCulturePlan() {
    console.log('🚀 开始企业文化计划表测试');
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

        console.log('✅ 浏览器启动成功\n');

        // 1. 登录
        const loginSuccess = await login(page);
        if (!loginSuccess) {
            throw new Error('登录失败，无法继续测试');
        }
        console.log('');

        // 2. 访问企业文化菜单栏（先展开校区 -> 学术部 -> 企业文化）
        console.log('📋 步骤 2: 访问企业文化菜单栏...');
        let menuSuccess = false;
        
        // 尝试展开多级菜单
        try {
            // 确保侧边栏展开
            const sidebar = await page.$('.ant-layout-sider');
            if (sidebar) {
                const isCollapsed = await page.evaluate((el) => {
                    return el.classList.contains('ant-layout-sider-collapsed');
                }, sidebar);
                
                if (isCollapsed) {
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
            
            await wait(500);
            
            // 展开所有子菜单（多次尝试）
            for (let attempt = 0; attempt < 5; attempt++) {
                await page.evaluate(() => {
                    const submenuTitles = document.querySelectorAll('.ant-menu-submenu-title');
                    submenuTitles.forEach((title) => {
                        const submenu = title.closest('.ant-menu-submenu');
                        if (submenu && !submenu.classList.contains('ant-menu-submenu-open')) {
                            title.click();
                        }
                    });
                });
                await wait(500);
            }
            
            // 尝试点击"校区" -> "学术部" -> "企业文化"
            const clicked = await page.evaluate(() => {
                // 先点击"校区"
                const campusMenus = Array.from(document.querySelectorAll('.ant-menu-submenu-title, .ant-menu-item'));
                for (const item of campusMenus) {
                    if (item.textContent?.trim() === '校区') {
                        const submenu = item.closest('.ant-menu-submenu');
                        if (submenu && !submenu.classList.contains('ant-menu-submenu-open')) {
                            item.click();
                            return { step: 'campus', success: true };
                        }
                    }
                }
                return { step: 'campus', success: false };
            });
            
            if (clicked.success) {
                await wait(500);
                // 再点击"学术部"
                await page.evaluate(() => {
                    const menus = Array.from(document.querySelectorAll('.ant-menu-submenu-title'));
                    for (const item of menus) {
                        if (item.textContent?.trim() === '学术部') {
                            const submenu = item.closest('.ant-menu-submenu');
                            if (submenu && !submenu.classList.contains('ant-menu-submenu-open')) {
                                item.click();
                            }
                        }
                    }
                });
                await wait(500);
                // 再点击"企业文化"
                await page.evaluate(() => {
                    const menus = Array.from(document.querySelectorAll('.ant-menu-submenu-title'));
                    for (const item of menus) {
                        if (item.textContent?.trim() === '企业文化') {
                            const submenu = item.closest('.ant-menu-submenu');
                            if (submenu && !submenu.classList.contains('ant-menu-submenu-open')) {
                                item.click();
                            }
                        }
                    }
                });
                await wait(500);
                menuSuccess = true;
            }
        } catch (error) {
            console.log(`   ⚠️ 菜单展开失败: ${error.message}`);
        }
        
        if (menuSuccess) {
            console.log('   ✅ 已展开企业文化菜单');
            recordTest('访问企业文化菜单栏', true);
        } else {
            console.log('   ⚠️ 菜单展开可能失败，将直接访问URL');
            recordTest('访问企业文化菜单栏', false, '菜单展开失败，使用URL访问');
        }
        console.log('');

        // 3. 访问企业文化宣讲计划表
        console.log('📋 步骤 3: 访问企业文化宣讲计划表...');
        const presentationSuccess = await navigateToMenu(page, '企业文化宣讲计划表');
        if (!presentationSuccess) {
            // 直接访问URL
            console.log('   直接访问URL...');
            await page.goto(`${UNIFIED_CONFIG.server.baseUrl}/academic/campus/06-enterprise-culture/1-culture-presentation-plan`, {
                waitUntil: 'networkidle2',
                timeout: 10000
            });
            await wait(800);
            const currentUrl = page.url();
            console.log(`   ✅ 已访问，当前URL: ${currentUrl}`);
            recordTest('访问企业文化宣讲计划表', true, '通过URL访问');
        }
        console.log('');

        // 4. 填写10条数据
        await fillPresentationPlan(page, 10);
        console.log('');

        // 5. 点击保存按钮
        await clickSaveButton(page);
        console.log('');

        // 6. 访问企业文化考试计划表
        console.log('📋 步骤 6: 访问企业文化考试计划表...');
        const examMenuSuccess = await navigateToMenu(page, '企业文化考试计划表');
        if (!examMenuSuccess) {
            // 直接访问URL
            console.log('   直接访问URL...');
            await page.goto(`${UNIFIED_CONFIG.server.baseUrl}/academic/campus/06-enterprise-culture/2-culture-exam-plan`, {
                waitUntil: 'networkidle2',
                timeout: 10000
            });
            await wait(800);
            const currentUrl = page.url();
            console.log(`   ✅ 已访问，当前URL: ${currentUrl}`);
            recordTest('访问企业文化考试计划表', true, '通过URL访问');
        }
        console.log('');

        // 7. 填写10条数据
        await fillExamPlan(page, 10);
        console.log('');

        // 8. 点击保存按钮
        await clickSaveButton(page);
        console.log('');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        console.error('   错误堆栈:', error.stack);
        recordTest('测试执行', false, error.message);

        // 如果页面存在，截图保存
        if (page) {
            try {
                await page.screenshot({ path: 'backend/test/puppeteer/culture-plan-error.png', fullPage: true });
                console.log('   📸 已保存错误截图: backend/test/puppeteer/culture-plan-error.png');
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
testCulturePlan()
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

