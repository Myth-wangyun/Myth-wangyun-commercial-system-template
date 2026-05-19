// 快速生成7个校区历史数据的脚本
import puppeteer from 'puppeteer';
import { UNIFIED_CONFIG } from './unified-config.js';
import { CAMPUS_DATA, MEDIA_SOURCE_DATA, STATISTICS_DATA_CONFIG } from './test-data.js';

const API_BASE = UNIFIED_CONFIG.server.apiBase;

// 使用统一配置的校区和媒体来源数据
const CAMPUSES = CAMPUS_DATA.campuses;
const MEDIA_SOURCES = MEDIA_SOURCE_DATA.mediaSources;

// 生成随机数据
function generateRandomData(date) {
    const baseImpressions = Math.floor(Math.random() * 50000) + 10000;
    const clickRate = Math.random() * 0.15 + 0.05;
    const clicks = Math.floor(baseImpressions * clickRate);
    const costPerClick = Math.random() * 5 + 1;
    const cost = Math.floor(clicks * costPerClick * 100) / 100;
    
    const conversationRate = Math.random() * 0.3 + 0.1;
    const conversations = Math.floor(clicks * conversationRate);
    const validConversationRate = Math.random() * 0.8 + 0.2;
    const validConversations = Math.floor(conversations * validConversationRate);
    
    const leadRate = Math.random() * 0.2 + 0.05;
    const leads = Math.floor(conversations * leadRate);
    
    const ipRate = Math.random() * 0.6 + 0.3;
    const ip = Math.floor(clicks * ipRate);
    
    const pvRate = Math.random() * 2 + 1;
    const pv = Math.floor(clicks * pvRate);
    
    return {
        日期: date,
        媒体来源: MEDIA_SOURCES[Math.floor(Math.random() * MEDIA_SOURCES.length)],
        消费金额: cost,
        展现量: baseImpressions,
        点击量: clicks,
        IP: ip,
        PV: pv,
        对话量: conversations,
        有效对话: validConversations,
        咨询量: leads
    };
}

// 生成日期范围（每月生成几条数据）
function generateMonthlyDates(startYear, endYear) {
    const dates = [];
    for (let year = startYear; year <= endYear; year++) {
        for (let month = 1; month <= 12; month++) {
            // 每月生成3-5条随机日期的数据
            const daysInMonth = new Date(year, month, 0).getDate();
            const recordsCount = Math.floor(Math.random() * 3) + 3; // 3-5条
            
            for (let i = 0; i < recordsCount; i++) {
                const day = Math.floor(Math.random() * daysInMonth) + 1;
                const date = new Date(year, month - 1, day);
                dates.push(date.toISOString().split('T')[0]);
            }
        }
    }
    return dates;
}

// 登录获取token
async function login() {
    console.log('🔐 正在登录...');
    
    const loginData = new URLSearchParams({
        username: 'admin',
        password: 'admin123'
    });
    
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginData
    });
    
    if (!res.ok) {
        throw new Error(`登录失败: ${res.status} ${await res.text()}`);
    }
    
    const data = await res.json();
    console.log('✅ 登录成功');
    return data.access_token;
}

// 为校区生成数据
async function generateCampusData(campus, token) {
    console.log(`\n📊 开始为 ${campus} 生成数据...`);
    
    const dates = generateMonthlyDates(2020, 2025);
    let successCount = 0;
    let errorCount = 0;
    
    for (const date of dates) {
        try {
            const data = generateRandomData(date);
            
            const res = await fetch(`${API_BASE}/campus-market/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Campus': encodeURIComponent(campus)
                },
                body: JSON.stringify(data)
            });
            
            if (res.ok) {
                successCount++;
            } else {
                errorCount++;
                console.error(`❌ ${campus} 插入失败 (${date}): ${res.status}`);
            }
            
            if (successCount % 50 === 0) {
                console.log(`  📈 ${campus}: 已插入 ${successCount} 条记录...`);
            }
            
        } catch (error) {
            errorCount++;
            console.error(`❌ ${campus} 错误 (${date}):`, error.message);
        }
    }
    
    console.log(`✅ ${campus} 完成: 成功 ${successCount} 条, 失败 ${errorCount} 条`);
    return { successCount, errorCount };
}

// 验证数据
async function verifyCampusData(campus, token) {
    try {
        const res = await fetch(`${API_BASE}/campus-market/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Campus': encodeURIComponent(campus)
            }
        });
        
        if (res.ok) {
            const data = await res.json();
            const count = Array.isArray(data) ? data.length : 0;
            console.log(`🔍 ${campus}: 验证到 ${count} 条记录`);
            return count;
        } else {
            console.error(`❌ ${campus} 验证失败: ${res.status}`);
            return 0;
        }
    } catch (error) {
        console.error(`❌ ${campus} 验证错误:`, error.message);
        return 0;
    }
}

// 主函数
async function main() {
    console.log('🚀 开始生成7个校区历史数据...');
    console.log('📅 时间范围: 2020-2025年 (每月3-5条记录)');
    console.log('🏫 校区数量: 7个');
    
    try {
        // 登录
        const token = await login();
        
        // 生成各校区数据
        const results = {};
        let totalSuccess = 0;
        let totalError = 0;
        
        for (const campus of CAMPUSES) {
            const result = await generateCampusData(campus, token);
            results[campus] = result;
            totalSuccess += result.successCount;
            totalError += result.errorCount;
        }
        
        // 验证数据
        console.log('\n🔍 验证数据...');
        for (const campus of CAMPUSES) {
            await verifyCampusData(campus, token);
        }
        
        // 输出统计
        console.log('\n' + '='.repeat(60));
        console.log('📊 生成完成统计');
        console.log('='.repeat(60));
        console.log(`✅ 总成功: ${totalSuccess} 条`);
        console.log(`❌ 总失败: ${totalError} 条`);
        console.log(`📈 成功率: ${((totalSuccess / (totalSuccess + totalError)) * 100).toFixed(2)}%`);
        
        console.log('\n🎉 数据生成完成！');
        
    } catch (error) {
        console.error('💥 生成失败:', error);
        process.exit(1);
    }
}

// 运行
main();
