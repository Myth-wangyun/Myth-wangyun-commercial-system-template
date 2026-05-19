#!/usr/bin/env node

/**
 * 运行企业文化数据批量插入测试脚本
 * 
 * 使用方法：
 * node frontend/test/run-seed-culture-data.js
 * 或
 * npm run test:seed:culture
 */

// 使用动态import来加载TypeScript模块（需要tsx或ts-node）
// 如果项目支持，可以直接运行TypeScript文件

const { spawn } = require('child_process')
const path = require('path')

const scriptPath = path.join(__dirname, 'seed-culture-data.ts')

// 检查是否有tsx或ts-node
const runners = ['tsx', 'ts-node', 'node']

async function runScript() {
  console.log('🚀 启动企业文化数据批量插入测试...\n')
  
  // 设置环境变量
  process.env.VITE_API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://172.16.0.130:8000/api/v1'
  
  // 尝试使用tsx运行（如果已安装）
  const useTsx = spawn('npx', ['tsx', scriptPath], {
    stdio: 'inherit',
    shell: true,
  })
  
  useTsx.on('error', (error) => {
    console.error('❌ 运行失败:', error.message)
    console.log('\n💡 提示: 请先安装 tsx: npm install -g tsx 或 npm install -D tsx')
    console.log('   或者使用: npx tsx frontend/test/seed-culture-data.ts')
    process.exit(1)
  })
  
  useTsx.on('close', (code) => {
    process.exit(code || 0)
  })
}

runScript()

