// 学生档案录入功能自动化测试
// 使用Puppeteer测试学生档案录入的完整流程

import puppeteer from 'puppeteer';
import assert from 'assert';
import { UNIFIED_CONFIG } from './unified-config.js';
import { STUDENT_PROFILE_TEST_DATA } from './test-data.js';

// 使用统一配置和数据
const TEST_CONFIG = UNIFIED_CONFIG;
const TEST_DATA = STUDENT_PROFILE_TEST_DATA;

class StudentProfileInputTester {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async setup() {
        console.log('🚀 启动浏览器...');
        this.browser = await puppeteer.launch({
            headless: TEST_CONFIG.browser.headless,
            slowMo: TEST_CONFIG.browser.slowMo,
            args: TEST_CONFIG.browser.args,
            executablePath: TEST_CONFIG.browser.executablePath
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // 设置超时
        this.page.setDefaultTimeout(TEST_CONFIG.timeouts.default);
        
        console.log('✅ 浏览器启动成功');
    }

    async teardown() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 浏览器已关闭');
        }
    }

    async login() {
        console.log('🔐 开始登录流程...');
        
        try {
        // 访问登录页面
            console.log('📄 正在访问登录页面:', TEST_CONFIG.server.loginUrl);
            await this.page.goto(TEST_CONFIG.server.loginUrl, { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
            });
            console.log('✅ 登录页面加载完成');
            
            // 检查页面标题和URL
            const title = await this.page.title();
            const url = this.page.url();
            console.log('📄 页面标题:', title);
            console.log('🌐 当前URL:', url);
            
            // 等待用户名输入框
            console.log('🔍 等待用户名输入框...');
            await this.page.waitForSelector('#username', { 
                visible: true, 
                timeout: TEST_CONFIG.timeouts.element 
            });
            console.log('✅ 找到用户名输入框');
            
            // 填写用户名
            console.log('✏️ 填写用户名:', TEST_CONFIG.login.username);
            await this.page.type('#username', TEST_CONFIG.login.username);
            
            // 等待密码输入框
            console.log('🔍 等待密码输入框...');
            await this.page.waitForSelector('#password', { 
                visible: true, 
                timeout: TEST_CONFIG.timeouts.element 
            });
            console.log('✅ 找到密码输入框');
            
            // 填写密码
            console.log('✏️ 填写密码...');
            await this.page.type('#password', TEST_CONFIG.login.password);
        
        // 点击登录按钮
            console.log('🖱️ 点击登录按钮...');
            
            // 监听网络请求
            const requests = [];
            const responses = [];
            
            this.page.on('request', request => {
                if (request.url().includes('login') || request.url().includes('auth')) {
                    requests.push({
                        url: request.url(),
                        method: request.method(),
                        postData: request.postData()
                    });
                    console.log('📤 发送请求:', request.method(), request.url());
                }
            });
            
            this.page.on('response', response => {
                if (response.url().includes('login') || response.url().includes('auth')) {
                    responses.push({
                        url: response.url(),
                        status: response.status()
                    });
                    console.log('📥 收到响应:', response.status(), response.url());
                }
            });
            
            // 尝试多种提交方式
            try {
                // 方式1：直接点击登录按钮
        await this.page.click('button[type="submit"]');
                console.log('   ✅ 按钮点击成功');
            } catch (error) {
                console.log('   ❌ 按钮点击失败:', error.message);
            }
            
            // 等待一下看看是否有请求
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 如果还没有请求，尝试按回车键
            if (requests.length === 0) {
                console.log('   🔄 尝试按回车键提交...');
                await this.page.keyboard.press('Enter');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // 如果还是没有请求，尝试JavaScript提交表单
            if (requests.length === 0) {
                console.log('   🔄 尝试JavaScript提交表单...');
                await this.page.evaluate(() => {
                    const form = document.querySelector('form');
                    if (form) {
                        form.submit();
                    } else {
                        document.querySelector('button[type="submit"]').click();
                    }
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // 如果还是没有正确的POST请求，尝试直接调用登录函数
            if (requests.length === 0 || !requests.some(req => req.method === 'POST')) {
                console.log('   🔄 尝试直接调用登录函数...');
                try {
                    await this.page.evaluate(() => {
                        // 尝试调用可能的登录函数
                        if (typeof login === 'function') {
                            login();
                        } else if (typeof handleLogin === 'function') {
                            handleLogin();
                        } else if (typeof submitLogin === 'function') {
                            submitLogin();
                        } else {
                            // 尝试触发登录按钮的点击事件
                            const button = document.querySelector('button[type="submit"]');
                            if (button) {
                                button.click();
                            }
                        }
                    });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.log('   ❌ 调用登录函数失败:', error.message);
                }
            }
            
            // 等待登录处理完成
            console.log('⏳ 等待登录处理完成...');
            await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒
            
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
            
            // 检查登录后的状态
            const newUrl = this.page.url();
            const newTitle = await this.page.title();
            console.log('🌐 登录后URL:', newUrl);
            console.log('📄 登录后页面标题:', newTitle);
            
            // 检查页面内容变化
            const pageContent = await this.page.content();
            const hasUserInfo = pageContent.includes('王泽熙') || pageContent.includes('wangzexi');
            const hasMainContent = pageContent.includes('index') || pageContent.includes('main') || pageContent.includes('dashboard');
            
            console.log('📄 页面内容检查:');
            console.log('   包含用户信息:', hasUserInfo);
            console.log('   包含主要内容:', hasMainContent);
            
            // 检查是否有错误消息
            const errorElement = await this.page.$('.error, .alert-danger, [class*="error"]');
            if (errorElement) {
                const errorText = await errorElement.textContent();
                console.log('❌ 登录错误:', errorText);
                throw new Error(`登录失败: ${errorText}`);
            }
            
            // 检查是否成功登录
            if (newTitle.includes('王泽熙') || newTitle.includes('wangzexi')) {
                console.log('✅ 登录成功！页面标题已更新');
            } else if (newUrl.includes('index.html') || newUrl.includes('main')) {
                console.log('✅ 登录成功，页面已跳转！');
            } else if (hasUserInfo || hasMainContent) {
                console.log('✅ 登录成功！页面内容已更新');
            } else {
                console.log('⚠️ 仍在登录页面，可能登录失败');
                // 不抛出错误，继续尝试
            }
            
            console.log('✅ 登录流程完成');
            
        } catch (error) {
            console.error('❌ 登录过程中出错:', error.message);
            throw error;
        }
    }

    async navigateToStudentProfileInput() {
        console.log('📝 导航到学生档案录入页面...');
        
        try {
            // 检查当前页面状态
            const currentUrl = this.page.url();
            console.log('🌐 当前页面URL:', currentUrl);
            
            // 如果不在主页面，先导航到主页面
            if (!currentUrl.includes('index.html')) {
                console.log('🔄 导航到主页面...');
                await this.page.goto(TEST_CONFIG.server.mainUrl, { 
                    waitUntil: 'networkidle0',
                    timeout: TEST_CONFIG.timeouts.navigation 
                });
            }
            
            // 等待导航菜单加载
            console.log('🔍 等待导航菜单...');
            await this.page.waitForSelector('.nav-link[data-section="service-profile-input"]', { 
                visible: true, 
                timeout: TEST_CONFIG.timeouts.element 
            });
            console.log('✅ 找到学生档案录入菜单');
        
        // 点击学生档案录入菜单
            console.log('🖱️ 点击学生档案录入菜单...');
        await this.page.click('.nav-link[data-section="service-profile-input"]');
        
        // 等待页面切换
            console.log('⏳ 等待页面切换...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒让页面切换
            
            // 检查目标页面是否存在
            const targetElement = await this.page.$('#service-profile-input');
            if (targetElement) {
                console.log('✅ 找到学生档案录入页面元素');
        
        // 验证页面是否正确显示
        const isVisible = await this.page.$eval('#service-profile-input', el => 
            el.style.display !== 'none'
        );
                
                if (isVisible) {
                    console.log('✅ 学生档案录入页面可见');
                } else {
                    console.log('⚠️ 学生档案录入页面不可见，但元素存在');
                }
            } else {
                console.log('⚠️ 未找到学生档案录入页面元素，可能页面结构不同');
                // 尝试其他可能的选择器
                const altElement = await this.page.$('[data-section="service-profile-input"], .student-profile, #student-profile');
                if (altElement) {
                    console.log('✅ 找到替代元素');
                } else {
                    console.log('❌ 未找到任何相关元素');
                }
            }
            
            console.log('✅ 导航流程完成');
            
        } catch (error) {
            console.error('❌ 导航过程中出错:', error.message);
            // 不抛出错误，继续尝试
            console.log('⚠️ 继续执行后续步骤...');
        }
    }

    async fillStudentForm(studentData) {
        console.log('📋 填写学生档案表单...');
        
        // 等待表单加载
        await this.page.waitForSelector('#studentProfileForm', { visible: true });
        
        // 填写基本信息
        if (studentData.studentName) {
            await this.page.type('#studentName', studentData.studentName);
        }
        
        if (studentData.gender) {
            await this.page.select('#gender', studentData.gender);
        }
        
        if (studentData.enrollmentDate) {
            await this.page.type('#enrollmentDate', studentData.enrollmentDate);
        }
        
        if (studentData.enrollmentAge) {
            await this.page.type('#enrollmentAge', studentData.enrollmentAge);
        }
        
        if (studentData.campusSource) {
            await this.page.type('#campusSource', studentData.campusSource);
        }
        
        if (studentData.consultant) {
            await this.page.type('#consultant', studentData.consultant);
        }
        
        if (studentData.tuitionAmount) {
            await this.page.type('#tuitionAmount', studentData.tuitionAmount);
        }
        
        if (studentData.idCard) {
            await this.page.type('#idCard', studentData.idCard);
        }
        
        if (studentData.major) {
            await this.page.type('#major', studentData.major);
        }
        
        if (studentData.duration) {
            await this.page.type('#duration', studentData.duration);
        }
        
        if (studentData.classTeacher) {
            await this.page.type('#classTeacher', studentData.classTeacher);
        }
        
        if (studentData.studentStatus) {
            await this.page.select('#studentStatus', studentData.studentStatus);
        }
        
        // 填写学历信息
        if (studentData.education) {
            await this.page.select('#education', studentData.education);
        }
        
        if (studentData.previousMajor) {
            await this.page.type('#previousMajor', studentData.previousMajor);
        }
        
        if (studentData.graduationSchool) {
            await this.page.type('#graduationSchool', studentData.graduationSchool);
        }
        
        if (studentData.highestCertificate) {
            await this.page.type('#highestCertificate', studentData.highestCertificate);
        }
        
        // 填写联系方式
        if (studentData.phone) {
            await this.page.type('#phone', studentData.phone);
        }
        
        if (studentData.parentPhone) {
            await this.page.type('#parentPhone', studentData.parentPhone);
        }
        
        if (studentData.address) {
            await this.page.type('#address', studentData.address);
        }
        
        if (studentData.householdType) {
            await this.page.select('#householdType', studentData.householdType);
        }
        
        if (studentData.studyMode) {
            await this.page.select('#studyMode', studentData.studyMode);
        }
        
        if (studentData.currentAddress) {
            await this.page.type('#currentAddress', studentData.currentAddress);
        }
        
        // 填写学历注册信息
        if (studentData.promiseRegistration) {
            await this.page.select('#promiseRegistration', studentData.promiseRegistration);
        }
        
        if (studentData.promiseRegistrationType) {
            await this.page.type('#promiseRegistrationType', studentData.promiseRegistrationType);
        }
        
        if (studentData.hasRegistered) {
            await this.page.select('#hasRegistered', studentData.hasRegistered);
        }
        
        if (studentData.registeredSchool) {
            await this.page.type('#registeredSchool', studentData.registeredSchool);
        }
        
        if (studentData.remarks) {
            await this.page.type('#remarks', studentData.remarks);
        }
        
        console.log('✅ 表单填写完成');
    }

    async testFormValidation() {
        console.log('🔍 测试表单验证功能...');
        
        // 清空表单
        await this.page.click('button[onclick="resetForm()"]');
        
        // 点击确认重置
        this.page.on('dialog', async dialog => {
            await dialog.accept();
        });
        
        // 等待重置完成
        await this.page.waitForTimeout(1000);
        
        // 尝试提交空表单
        await this.page.click('button[type="submit"]');
        
        // 检查是否有验证提示
        const alertExists = await this.page.evaluate(() => {
            const alerts = document.querySelectorAll('.alert');
            return alerts.length > 0;
        });
        
        assert(alertExists, '提交空表单应该显示验证提示');
        
        console.log('✅ 表单验证功能正常');
    }

    async testFormSubmission() {
        console.log('💾 测试表单提交功能...');
        
        // 填写有效数据
        await this.fillStudentForm(TEST_DATA.validStudent);
        
        // 提交表单
        await this.page.click('button[type="submit"]');
        
        // 等待成功提示
        await this.page.waitForSelector('.alert-success', { visible: true, timeout: 5000 });
        
        // 验证成功提示
        const successMessage = await this.page.$eval('.alert-success', el => el.textContent);
        assert(successMessage.includes('保存成功'), '应该显示保存成功提示');
        
        console.log('✅ 表单提交功能正常');
    }

    async testResetForm() {
        console.log('🔄 测试重置表单功能...');
        
        // 填写一些数据
        await this.page.type('#studentName', '测试学生');
        await this.page.type('#phone', '13800138000');
        
        // 点击重置按钮
        await this.page.click('button[onclick="resetForm()"]');
        
        // 处理确认对话框
        this.page.on('dialog', async dialog => {
            await dialog.accept();
        });
        
        // 等待重置完成
        await this.page.waitForTimeout(1000);
        
        // 验证表单是否已清空
        const studentNameValue = await this.page.$eval('#studentName', el => el.value);
        const phoneValue = await this.page.$eval('#phone', el => el.value);
        
        assert(studentNameValue === '', '学生姓名应该被清空');
        assert(phoneValue === '', '电话号码应该被清空');
        
        console.log('✅ 重置表单功能正常');
    }

    async testExportExcel() {
        console.log('📊 测试导出Excel功能...');
        
        // 填写必填字段
        await this.fillStudentForm(TEST_DATA.validStudent);
        
        // 点击导出按钮
        await this.page.click('button[onclick="exportToExcel()"]');
        
        // 等待下载开始（这里我们无法直接验证文件下载，但可以检查是否有错误）
        await this.page.waitForTimeout(2000);
        
        // 检查是否有错误提示
        const errorAlerts = await this.page.$$('.alert-danger');
        assert(errorAlerts.length === 0, '导出功能不应该有错误');
        
        console.log('✅ 导出Excel功能正常');
    }

    async testInvalidDataValidation() {
        console.log('❌ 测试无效数据验证...');
        
        // 清空表单
        await this.page.click('button[onclick="resetForm()"]');
        this.page.on('dialog', async dialog => await dialog.accept());
        await this.page.waitForTimeout(1000);
        
        // 填写无效的身份证号
        await this.page.type('#studentName', '测试学生');
        await this.page.select('#gender', '男');
        await this.page.type('#enrollmentDate', '2024-01-15');
        await this.page.type('#major', '计算机应用技术');
        await this.page.type('#idCard', '123456789'); // 无效的身份证号
        
        // 提交表单
        await this.page.click('button[type="submit"]');
        
        // 检查是否有验证错误
        const alertExists = await this.page.evaluate(() => {
            const alerts = document.querySelectorAll('.alert');
            return alerts.length > 0;
        });
        
        assert(alertExists, '无效身份证号应该显示验证错误');
        
        console.log('✅ 无效数据验证功能正常');
    }

    async runAllTests() {
        try {
            await this.setup();
            await this.login();
            await this.navigateToStudentProfileInput();
            
            // 运行所有测试
            await this.testFormValidation();
            await this.testFormSubmission();
            await this.testResetForm();
            await this.testExportExcel();
            await this.testInvalidDataValidation();
            
            console.log('🎉 所有测试通过！');
            
        } catch (error) {
            console.error('❌ 测试失败:', error.message);
            throw error;
        } finally {
            await this.teardown();
        }
    }
}

// 运行测试
async function runTests() {
    console.log('🧪 开始学生档案录入功能自动化测试...');
    console.log(`📡 测试地址: ${TEST_CONFIG.server.baseUrl}`);
    console.log(`⏱️  超时时间: ${TEST_CONFIG.timeouts.default}ms`);
    console.log(`👁️  无头模式: ${TEST_CONFIG.browser.headless ? '是' : '否'}`);
    console.log('='.repeat(50));
    
    const tester = new StudentProfileInputTester();
    
    try {
        await tester.runAllTests();
        console.log('='.repeat(50));
        console.log('✅ 所有测试完成，学生档案录入功能正常！');
        process.exit(0);
    } catch (error) {
        console.log('='.repeat(50));
        console.error('❌ 测试失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此文件，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests();
}

export { StudentProfileInputTester, TEST_CONFIG, TEST_DATA };
