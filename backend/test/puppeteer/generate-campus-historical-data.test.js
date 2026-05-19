// Puppeteer 自动化: 生成7个校区2020年1月1日到2025年10月20日的历史数据
import puppeteer from 'puppeteer';
import fs from 'fs';
import assert from 'assert';

const FRONT_URL = process.env.FRONT_URL || 'http://127.0.0.1:3000/index.html';
const API_BASE = (process.env.API_BASE || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

// 7个校区配置
const CAMPUSES = [
    '盛邦校区',
    '冀美校区', 
    '石美校区',
    '晋美校区',
    '原美校区',
    '太美校区',
    '桂美校区'
];

// 媒体来源配置
const MEDIA_SOURCES = [
    '百度推广',
    '中心来电',
    '其他网络',
    'TQ',
    '网络',
    '网络渠道',
    '教学口碑',
    '在校生口碑',
    '毕业生口碑',
    '市场口碑',
    '咨询师口碑'
];

// 生成随机数据的辅助函数
function generateRandomData(date) {
    const baseImpressions = Math.floor(Math.random() * 50000) + 10000; // 10000-60000
    const clickRate = Math.random() * 0.15 + 0.05; // 5%-20%
    const clicks = Math.floor(baseImpressions * clickRate);
    const costPerClick = Math.random() * 5 + 1; // 1-6元
    const cost = Math.floor(clicks * costPerClick * 100) / 100;
    
    const conversationRate = Math.random() * 0.3 + 0.1; // 10%-40%
    const conversations = Math.floor(clicks * conversationRate);
    const validConversationRate = Math.random() * 0.8 + 0.2; // 20%-100%
    const validConversations = Math.floor(conversations * validConversationRate);
    
    const leadRate = Math.random() * 0.2 + 0.05; // 5%-25%
    const leads = Math.floor(conversations * leadRate);
    
    const ipRate = Math.random() * 0.6 + 0.3; // 30%-90%
    const ip = Math.floor(clicks * ipRate);
    
    const pvRate = Math.random() * 2 + 1; // 1-3倍
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

// 生成日期范围
function generateDateRange(startDate, endDate) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
}

// API调用函数
async function apiGet(path, headers = {}) {
    const url = API_BASE + path;
    const res = await fetch(url, { headers });
    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
    if (!res.ok) {
        throw new Error(`GET ${path} status=${res.status} body=${text.slice(0,300)}`);
    }
    return json;
}

async function apiPost(path, body, headers = {}) {
    const url = API_BASE + path;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body)
    });
    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
    if (!res.ok) {
        throw new Error(`POST ${path} status=${res.status} body=${text.slice(0,300)}`);
    }
    return json;
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

// 为指定校区生成数据
async function generateCampusData(campus, startDate, endDate, token) {
    console.log(`\n📊 开始为 ${campus} 生成数据...`);
    
    const dates = generateDateRange(startDate, endDate);
    const totalDays = dates.length;
    let successCount = 0;
    let errorCount = 0;
    
    // 每天生成1-3条记录
    for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const recordsPerDay = Math.floor(Math.random() * 3) + 1; // 1-3条记录
        
        for (let j = 0; j < recordsPerDay; j++) {
            try {
                const data = generateRandomData(date);
                
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'X-Campus': encodeURIComponent(campus)
                };
                
                const result = await apiPost('/campus-market/', data, headers);
                successCount++;
                
                if (successCount % 100 === 0) {
                    console.log(`  📈 ${campus}: 已插入 ${successCount} 条记录...`);
                }
                
            } catch (error) {
                errorCount++;
                console.error(`  ❌ ${campus} 插入数据失败 (${date}):`, error.message);
            }
        }
        
        // 每100天显示一次进度
        if ((i + 1) % 100 === 0) {
            console.log(`  📅 ${campus}: 已完成 ${i + 1}/${totalDays} 天`);
        }
    }
    
    console.log(`✅ ${campus} 数据生成完成: 成功 ${successCount} 条, 失败 ${errorCount} 条`);
    return { successCount, errorCount };
}

// 验证数据插入结果
async function verifyData(campus, token) {
    console.log(`\n🔍 验证 ${campus} 数据...`);
    
    try {
        const headers = {
            'Authorization': `Bearer ${token}`,
            'X-Campus': encodeURIComponent(campus)
        };
        
        const data = await apiGet('/campus-market/', headers);
        const count = Array.isArray(data) ? data.length : 0;
        
        console.log(`✅ ${campus}: 共 ${count} 条记录`);
        return count;
    } catch (error) {
        console.error(`❌ ${campus} 验证失败:`, error.message);
        return 0;
    }
}

// 主测试函数
async function testGenerateHistoricalData() {
    console.log('🚀 开始生成7个校区历史数据...');
    console.log('📅 时间范围: 2020-01-01 到 2025-10-20');
    console.log('🏫 校区数量: 7个');
    
    let browser;
    try {
        // 登录获取token
        const token = await login();
        
        // 生成各校区数据
        const results = {};
        const totalStats = { success: 0, error: 0 };
        
        for (const campus of CAMPUSES) {
            const result = await generateCampusData(campus, '2020-01-01', '2025-10-20', token);
            results[campus] = result;
            totalStats.success += result.successCount;
            totalStats.error += result.errorCount;
        }
        
        // 验证数据
        console.log('\n🔍 验证数据插入结果...');
        const verificationResults = {};
        
        for (const campus of CAMPUSES) {
            const count = await verifyData(campus, token);
            verificationResults[campus] = count;
        }
        
        // 输出最终统计
        console.log('\n' + '='.repeat(80));
        console.log('📊 数据生成完成统计');
        console.log('='.repeat(80));
        
        for (const campus of CAMPUSES) {
            const result = results[campus];
            const verified = verificationResults[campus];
            console.log(`${campus}:`);
            console.log(`  ✅ 成功插入: ${result.successCount} 条`);
            console.log(`  ❌ 失败: ${result.errorCount} 条`);
            console.log(`  🔍 验证记录数: ${verified} 条`);
            console.log('');
        }
        
        console.log('📈 总计统计:');
        console.log(`  ✅ 总成功: ${totalStats.success} 条`);
        console.log(`  ❌ 总失败: ${totalStats.error} 条`);
        console.log(`  📊 成功率: ${((totalStats.success / (totalStats.success + totalStats.error)) * 100).toFixed(2)}%`);
        
        // 保存结果到文件
        const report = {
            timestamp: new Date().toISOString(),
            dateRange: { start: '2020-01-01', end: '2025-10-20' },
            campuses: CAMPUSES,
            results: results,
            verification: verificationResults,
            totalStats: totalStats
        };
        
        fs.writeFileSync('campus-data-generation-report.json', JSON.stringify(report, null, 2));
        console.log('\n💾 详细报告已保存到: campus-data-generation-report.json');
        
        return true;
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
        return false;
    }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
    testGenerateHistoricalData()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 测试执行失败:', error);
            process.exit(1);
        });
}

export { testGenerateHistoricalData };
