#!/usr/bin/env node

// 配置验证脚本
// 用于验证统一配置和数据文件是否正确导入

import { UNIFIED_CONFIG } from './unified-config.js';
import { STUDENT_PROFILE_TEST_DATA, CAMPUS_DATA, MEDIA_SOURCE_DATA } from './test-data.js';

console.log('🔍 验证 Puppeteer 测试配置...');
console.log('='.repeat(50));

// 验证统一配置
console.log('📋 统一配置验证:');
console.log(`✅ 服务器地址: ${UNIFIED_CONFIG.server.baseUrl}`);
console.log(`✅ API 地址: ${UNIFIED_CONFIG.server.apiBase}`);
console.log(`✅ 登录页面: ${UNIFIED_CONFIG.server.loginUrl}`);
console.log(`✅ 浏览器路径: ${UNIFIED_CONFIG.browser.executablePath}`);
console.log(`✅ 无头模式: ${UNIFIED_CONFIG.browser.headless}`);
console.log(`✅ 操作延迟: ${UNIFIED_CONFIG.browser.slowMo}ms`);
console.log(`✅ 默认超时: ${UNIFIED_CONFIG.timeouts.default}ms`);
console.log(`✅ 登录用户: ${UNIFIED_CONFIG.login.username}`);
console.log('');

// 验证测试数据
console.log('📊 测试数据验证:');
console.log(`✅ 校区数量: ${CAMPUS_DATA.campuses.length}`);
console.log(`✅ 校区列表: ${CAMPUS_DATA.campuses.join(', ')}`);
console.log(`✅ 媒体来源数量: ${MEDIA_SOURCE_DATA.mediaSources.length}`);
console.log(`✅ 学生档案测试数据: ${Object.keys(STUDENT_PROFILE_TEST_DATA).length} 个测试用例`);
console.log('');

// 验证浏览器配置参数
console.log('🌐 浏览器配置参数:');
UNIFIED_CONFIG.browser.args.forEach(arg => {
    console.log(`✅ 参数: ${arg}`);
});
console.log('');

// 验证导入的模块
try {
    const puppeteer = await import('puppeteer');
    console.log('✅ Puppeteer 模块导入成功');
} catch (error) {
    console.log('❌ Puppeteer 模块导入失败:', error.message);
}

console.log('='.repeat(50));
console.log('🎉 配置验证完成！');
console.log('');
console.log('💡 使用说明:');
console.log('   - 运行测试: node run-student-profile-test.js');
console.log('   - 生成数据: node quick-campus-data-generator.js');
console.log('   - 批量测试: node bulk-insert-statistics.test.js');
