// 统一 Puppeteer 测试配置文件
// 所有测试脚本共享的配置

import { platform } from 'os';
import { existsSync } from 'fs';

/**
 * 根据操作系统自动检测浏览器路径
 */
function getBrowserExecutablePath() {
    const osPlatform = platform();
    
    // Windows 平台
    if (osPlatform === 'win32') {
        const possiblePaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
        ];
        
        // 添加环境变量路径（如果存在）
        if (process.env.LOCALAPPDATA) {
            possiblePaths.push(process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe');
        }
        if (process.env.PROGRAMFILES) {
            possiblePaths.push(process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe');
        }
        if (process.env['PROGRAMFILES(X86)']) {
            possiblePaths.push(process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe');
        }
        
        for (const path of possiblePaths) {
            if (path && existsSync(path)) {
                return path;
            }
        }
        
        // 如果找不到 Chrome，返回 undefined，让 puppeteer 使用自带的 Chromium
        return undefined;
    }
    
    // Linux 平台
    if (osPlatform === 'linux') {
        const possiblePaths = [
            '/snap/bin/chromium',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable'
        ];
        
        for (const path of possiblePaths) {
            if (existsSync(path)) {
                return path;
            }
        }
        
        return undefined;
    }
    
    // macOS 平台
    if (osPlatform === 'darwin') {
        const possiblePaths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium'
        ];
        
        for (const path of possiblePaths) {
            if (existsSync(path)) {
                return path;
            }
        }
        
        return undefined;
    }
    
    // 其他平台，返回 undefined，使用 puppeteer 自带的 Chromium
    return undefined;
}

// 获取浏览器可执行文件路径
const browserExecutablePath = getBrowserExecutablePath();

export const UNIFIED_CONFIG = {
    // 服务器配置
    server: {
        baseUrl: 'http://localhost:5173',
        loginUrl: 'http://localhost:5173/login.html',
        mainUrl: 'http://localhost:5173/index.html',
        apiBase: 'http://localhost:8000/api/v1'
    },
    
    // 浏览器配置
    browser: {
        headless: false, // 无头模式，适合命令行运行
        slowMo: 0, // 无延迟，快速执行
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
        // 根据平台自动检测浏览器路径，如果找不到则使用 puppeteer 自带的 Chromium
        ...(browserExecutablePath ? { executablePath: browserExecutablePath } : {})
    },
    
    // 超时配置
    timeouts: {
        default: 30000,
        navigation: 10000,
        element: 5000
    },
    
    // 登录配置
    login: {
        username: 'wangzexi',
        password: 'wangzexi123456'
    }
};

// 导出默认配置（向后兼容）
export const TEST_CONFIG = UNIFIED_CONFIG;
