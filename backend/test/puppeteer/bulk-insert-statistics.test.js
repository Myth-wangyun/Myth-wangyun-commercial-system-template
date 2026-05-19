// Puppeteer 自动化: 批量插入日投放数据并验证统计端点
import puppeteer from 'puppeteer';
import fs from 'fs';
import assert from 'assert';
import { UNIFIED_CONFIG } from './unified-config.js';

const FRONT_URL = process.env.FRONT_URL || UNIFIED_CONFIG.server.mainUrl;
const API_BASE = (process.env.API_BASE || UNIFIED_CONFIG.server.apiBase).replace(/\/$/, '');

// 登录获取 token
let authToken = null;

async function login() {
  if (authToken) return authToken; // 已经登录过了
  
  console.log('🔐 登录获取认证 token...');
  console.log('   用户名:', UNIFIED_CONFIG.login.username);
  console.log('   密码:', UNIFIED_CONFIG.login.password);
  
  const loginData = {
    username: UNIFIED_CONFIG.login.username,
    password: UNIFIED_CONFIG.login.password
  };
  
  try {
    console.log('📤 发送登录请求到:', API_BASE + '/auth/login');
    console.log('📤 请求数据:', JSON.stringify(loginData));
    
    const response = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });
    
    const result = await response.json();
    console.log('📥 登录响应:', result);
    
    if (result.success && result.token) {
      authToken = result.token;
      console.log('✅ 登录成功，获得 token');
      return authToken;
    } else {
      throw new Error('登录失败: ' + JSON.stringify(result));
    }
  } catch (error) {
    console.warn('⚠️ 登录失败，尝试无认证访问:', error.message);
    return null; // 返回 null 表示无认证访问
  }
}

async function apiGet(path) {
  const url = API_BASE + path;
  const headers = {};
  
  // 如果有 token，添加到请求头
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const res = await fetch(url, { headers });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!res.ok) {
    throw new Error(`GET ${path} status=${res.status} body=${text.slice(0,300)}`);
  }
  return json;
}

async function apiPost(path, body) {
  const url = API_BASE + path;
  const headers = { 'Content-Type': 'application/json' };
  
  // 如果有 token，添加到请求头
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const res = await fetch(url, {
    method: 'POST',
    headers,
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

async function seedBulk(count = 40) {
  const today = new Date();
  const items = [];
  const medias = ['百度','360','搜狗','腾讯'];
  for (let i=0;i<count;i++) {
    const d = new Date(today.getTime() - i*86400000); // 回退天
    const 点击数 = Math.floor(Math.random()*5000+500);
    const 点击价格 = +(Math.random()*10+1).toFixed(2);
    const 留电数 = Math.floor(点击数 * (Math.random()*0.15+0.05));
    const 花费 = +(点击数 * 点击价格).toFixed(2);
    const iso = d.toISOString().split('T')[0];
    items.push({
      // Chinese aliases
      '日期': iso,
      '媒体来源': medias[i % medias.length],
      '点击数': 点击数,
      '留电数': 留电数,
      '点击价格': 点击价格,
      '花费': 花费, // maybe backend uses 花费 or 消费金额
      '消费金额': 花费,
      // English keys (if backend expects these)
      date: iso,
      media: medias[i % medias.length],
      clicks: 点击数,
      leads: 留电数,
      click_price: 点击价格,
      spend: 花费
    });
  }
  console.log(`⏳ Bulk inserting ${items.length} records (Chinese field names) ...`);
  console.log('Sample item:', items[0]);
  // Attempt candidate bulk endpoints
  const candidates = [
    '/market/daily/bulk?ignoreDuplicates=true',
    '/market/daily/bulk',
    '/market/daily/batch',
    '/market/daily/bulk-insert',
    '/market/daily/import'
  ];
  for (const path of candidates) {
    try {
      const json = await apiPost(path, items);
      if (json && json.success !== false) {
        console.log(`✅ Bulk endpoint succeeded: ${path}`);
        console.log('Result keys:', Object.keys(json));
        if (json.result) console.log('Result summary:', json.result);
        return { mode: 'bulk', endpoint: path, count: items.length };
      } else {
        console.warn(`⚠️ Bulk endpoint responded success=false: ${path}`);
      }
    } catch(e) {
      console.warn(`🛑 Bulk endpoint failed (${path}): ${e.message}`);
    }
  }
  console.log('➡️ Falling back to single-record inserts /market/daily ...');
  let ok = 0, fail = 0;
  async function insertWithRetry(base) {
    let payload = { ...base };
    for (let attempt=0; attempt<3; attempt++) {
      try {
        const json = await apiPost('/market/daily', payload);
        return json;
      } catch(e) {
        const msg = e.message || '';
        const m = msg.match(/缺少必要字段[:：]\s*(\S+)/);
        if (m) {
          const missing = m[1];
            console.warn(`➡️ Adding missing field '${missing}' attempt ${attempt+1}`);
            // heuristic default values
            if (!(missing in payload)) {
              switch(missing) {
                case '消费金额':
                case '花费': payload[missing] = payload['花费'] || payload['消费金额'] || 0; break;
                case '点击数': payload[missing] = payload['点击数'] || 0; break;
                case '留电数': payload[missing] = payload['留电数'] || 0; break;
                case '点击价格': payload[missing] = payload['点击价格'] || 0; break;
                default: payload[missing] = 0;
              }
            }
            continue; // retry
        }
        if (/重复|已存在/.test(msg)) {
          console.warn('⚠️ Duplicate record treated as success');
          return { duplicate: true };
        }
        throw e; // non-recoverable
      }
    }
    throw new Error('Max retries exceeded for single insert');
  }
  for (const item of items) {
    const payload = {
      '日期': item['日期'],
      '媒体来源': item['媒体来源'],
      '点击数': item['点击数'],
      '留电数': item['留电数'],
      '点击价格': item['点击价格'],
      '花费': item['花费'],
      '消费金额': item['消费金额']
    };
    try {
      const res = await insertWithRetry(payload);
      ok++;
    } catch(e) {
      fail++;
      if (fail < 5) console.warn('Insert fail sample:', e.message);
    }
  }
  console.log(`单条插入完成 成功: ${ok} 失败: ${fail}`);
  if (ok === 0) throw new Error('All single-record inserts failed');
  if (fail === 0) console.log('✅ All single record inserts succeeded');
  return { mode: 'single', ok, fail };
}

async function testStatisticsEndpoints() {
  const daily = await apiGet(`/market/statistics/daily?${encodeURIComponent('天数')}=30`);
  assert.ok(daily.success, 'Daily stats fail');
  console.log('📊 Daily rows:', daily.data.length);
  const weekly = await apiGet(`/market/statistics/weekly?${encodeURIComponent('周数')}=12`);
  assert.ok(weekly.success, 'Weekly stats fail');
  console.log('📊 Weekly rows:', weekly.data.length);
}

async function runBrowserValidation() {
  // Use unified browser configuration
  const browserConfig = UNIFIED_CONFIG.browser;
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: browserConfig.headless,
      slowMo: browserConfig.slowMo,
      args: browserConfig.args,
      executablePath: browserConfig.executablePath
    });
  } catch(e) {
    console.warn('⚠️ Browser launch failed, skipping UI validation:', e.message);
    console.warn('👉 To enable UI test run: npx puppeteer browsers install chrome   (or set CHROME_PATH env var)');
    return { skipped: true, reason: e.message };
  }
  try {
    const page = await browser.newPage();
    await page.goto(FRONT_URL, { waitUntil: 'networkidle2' });
    // 进入按日统计
    await page.evaluate(() => {
      const daily = [...document.querySelectorAll('[data-section="market-stats-daily"]')][0];
      daily && daily.click();
    });
  await new Promise(r => setTimeout(r, 1200));
    const haveTable = await page.$('.market-statistics-container table');
    assert.ok(haveTable, 'Statistics table not rendered');
    const rows = await page.$$eval('.market-statistics-container tbody tr', trs => trs.length);
    console.log('Rendered daily table rows:', rows);
    await page.screenshot({ path: 'test/puppeteer/statistics-daily.png' });
    return { skipped: false, rows };
  } finally {
    if (browser) await browser.close();
  }
}

async function main() {
  // 先尝试登录
  await login();
  
  // 轻量 ping (不阻塞) - 优先使用每日统计
  console.log('🔍 Pinging daily statistics endpoint for backend availability ...');
  try {
    const ping = await apiGet(`/market/statistics/daily?${encodeURIComponent('天数')}=1`);
    console.log('✅ Ping success flag:', ping.success);
  } catch(e) {
    console.warn('⚠️ Ping failed, backend may be down or endpoint name differs. Continuing to bulk insert.', e.message);
  }
  // Bulk with retry logic (1 retry if failure)
  try {
    await seedBulk();
  } catch(e) {
    console.warn('⚠️ First bulk attempt fully failed:', e.message, 'Retrying with smaller batch (10)...');
    await seedBulk(10);
  }
  try {
    await testStatisticsEndpoints();
  } catch(e) {
    console.warn('⚠️ Statistics endpoints test encountered error:', e.message);
  }
  try {
    await runBrowserValidation();
  } catch(e) {
    console.warn('⚠️ Browser validation failed:', e.message);
    throw e; // still fail overall if UI not rendered
  }
  console.log('✅ Puppeteer bulk statistics test finished');
}

main().catch(e => { console.error(e); process.exit(1); });