#!/usr/bin/env node

// 简化的学生档案录入测试运行脚本
// 使用方法: node run-student-profile-test.js

import { StudentProfileInputTester } from './student-profile-input.test.js';
import { UNIFIED_CONFIG } from './unified-config.js';

// 检查服务器是否运行
async function checkServer() {
    try {
        const response = await fetch(UNIFIED_CONFIG.server.baseUrl);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// 主函数
async function main() {
    console.log('🧪 学生档案录入功能自动化测试');
    console.log('='.repeat(50));
    
    // 检查服务器状态
    console.log('🔍 检查服务器状态...');
    const serverRunning = await checkServer();
    
    if (!serverRunning) {
        console.error('❌ 服务器未运行！');
        console.error('请确保前端服务器在 http://localhost:3000 运行');
        console.error('请确保后端服务器在 http://localhost:8000 运行');
        process.exit(1);
    }
    
    console.log('✅ 服务器运行正常');
    console.log('');
    
    // 显示测试配置
    console.log('📋 测试配置:');
    console.log(`   前端地址: ${UNIFIED_CONFIG.server.baseUrl}`);
    console.log(`   登录用户: ${UNIFIED_CONFIG.login.username}`);
    console.log(`   无头模式: ${UNIFIED_CONFIG.browser.headless ? '是' : '否'}`);
    console.log(`   操作延迟: ${UNIFIED_CONFIG.browser.slowMo}ms`);
    console.log('');
    
    // 创建测试实例
    const tester = new StudentProfileInputTester();
    
    try {
        // 运行测试
        await tester.runAllTests();
        
        console.log('');
        console.log('🎉 测试完成！');
        console.log('✅ 学生档案录入功能运行正常');
        
    } catch (error) {
        console.log('');
        console.error('❌ 测试失败:', error.message);
        console.error('详细错误信息:', error.stack);
        process.exit(1);
    }
}

// 处理未捕获的异常
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
    process.exit(1);
});

// 运行主函数
main();
