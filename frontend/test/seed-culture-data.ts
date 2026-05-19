/**
 * 企业文化宣讲计划表和考试计划表批量数据插入测试脚本
 * 
 * 功能：
 * - 向至少2个神殿、2个年份、2个月份各插入10条数据
 * - 测试企业文化宣讲计划表
 * - 测试企业文化考试计划表
 */

import axios from 'axios'
import type { PlanRow } from '../services/culturePresentation'
import type { ExamPlanRow } from '../services/cultureExam'

// API配置
const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://172.16.0.130:8000/api/v1'

// 测试数据配置
const TEST_CONFIG = {
  campuses: ['主神殿', '永恒殿'], // 至少2个神殿
  years: [2024, 2025], // 至少2个年份
  months: [10, 11], // 至少2个月份
  recordsPerBatch: 10, // 每个批次10条数据
}

// 创建axios实例（不依赖前端store）
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 生成随机日期（指定年月）
function generateRandomDate(year: number, month: number): string {
  const daysInMonth = new Date(year, month, 0).getDate()
  const day = Math.floor(Math.random() * daysInMonth) + 1
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// 生成随机字符串
function randomString(length: number, prefix: string = ''): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = prefix
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 生成宣讲计划测试数据
function generatePresentationPlanRows(count: number, year: number, month: number): PlanRow[] {
  const rows: PlanRow[] = []
  const locations = ['第一教室', '第二教室', '会议室A', '会议室B', '大礼堂']
  const methods = ['线下宣讲', '线上直播', '混合模式', '录播回放']
  const topics = [
    '企业文化核心价值观',
    '团队协作与沟通',
    '职业发展规划',
    '公司制度与规范',
    '创新思维培养',
    '客户服务理念',
    '质量意识提升',
    '安全管理制度',
  ]
  const speakers = ['张老师', '李老师', '王老师', '赵老师', '刘老师']
  const audiences = ['新员工', '全体员工', '管理层', '技术团队', '销售团队']

  for (let i = 1; i <= count; i++) {
    rows.push({
      key: `row-${i}`,
      index: i,
      time: generateRandomDate(year, month),
      location: locations[Math.floor(Math.random() * locations.length)],
      method: methods[Math.floor(Math.random() * methods.length)],
      topic: topics[Math.floor(Math.random() * topics.length)],
      summary: `宣讲内容概述-${randomString(20, 'SUMMARY-')}`,
      audience: audiences[Math.floor(Math.random() * audiences.length)],
      speaker: speakers[Math.floor(Math.random() * speakers.length)],
      materials: `需准备资料-${randomString(15, 'MAT-')}`,
      remark: `备注信息-${randomString(10, 'REMARK-')}`,
    })
  }

  return rows
}

// 生成考试计划测试数据
function generateExamPlanRows(count: number, year: number, month: number): ExamPlanRow[] {
  const rows: ExamPlanRow[] = []
  const locations = ['第一考场', '第二考场', '第三考场', '计算机房A', '计算机房B']
  const methods = ['笔试', '机试', '混合考试', '在线考试']
  const scopes = [
    '企业文化基础知识',
    '公司制度与规范',
    '安全管理制度',
    '职业素养',
    '服务标准',
    '质量体系',
  ]
  const organizers = ['人事部', '培训部', '质量部', '行政部']
  const proctors = ['监考A', '监考B', '监考C', '监考D']
  const audiences = ['新员工', '全体员工', '特定部门', '管理层']

  for (let i = 1; i <= count; i++) {
    rows.push({
      key: `row-${i}`,
      index: i,
      time: generateRandomDate(year, month),
      location: locations[Math.floor(Math.random() * locations.length)],
      method: methods[Math.floor(Math.random() * methods.length)],
      scope: scopes[Math.floor(Math.random() * scopes.length)],
      audience: audiences[Math.floor(Math.random() * audiences.length)],
      organizer: organizers[Math.floor(Math.random() * organizers.length)],
      proctor: proctors[Math.floor(Math.random() * proctors.length)],
      materials: `需准备资料-${randomString(15, 'EXAM-MAT-')}`,
      remark: `备注信息-${randomString(10, 'EXAM-REMARK-')}`,
    })
  }

  return rows
}

// 保存宣讲计划
async function savePresentationPlan(
  campus: string,
  year: number,
  month: number,
  rows: PlanRow[]
): Promise<void> {
  const 行数据 = rows.map((row) => ({
    序号: row.index,
    宣讲时间: row.time || undefined,
    宣讲地点: row.location || undefined,
    宣讲方式: row.method || undefined,
    宣讲主题: row.topic || undefined,
    宣讲内容概述: row.summary || undefined,
    宣讲对象: row.audience || undefined,
    主讲人: row.speaker || undefined,
    需准备资料: row.materials || undefined,
    备注: row.remark || undefined,
  }))

  const planData = {
    神殿名称: campus,
    年份: year,
    月份: month,
    行数据,
  }

  try {
    // 先尝试获取，如果存在则更新，否则创建
    try {
      await api.get(`/culture-presentation/${encodeURIComponent(campus)}/${year}/${month}`)
      // 如果存在，更新
      await api.put(`/culture-presentation/${encodeURIComponent(campus)}/${year}/${month}`, {
        行数据,
      })
      console.log(`  ✅ 更新宣讲计划: ${campus} ${year}年${month}月`)
    } catch (error: any) {
      // 如果不存在（404），创建
      if (error.response?.status === 404) {
        await api.post('/culture-presentation/', planData)
        console.log(`  ✅ 创建宣讲计划: ${campus} ${year}年${month}月`)
      } else {
        throw error
      }
    }
  } catch (error: any) {
    console.error(
      `  ❌ 保存宣讲计划失败: ${campus} ${year}年${month}月`,
      error.response?.data || error.message,
    )
    throw error
  }
}

// 保存考试计划
async function saveExamPlan(
  campus: string,
  year: number,
  month: number,
  rows: ExamPlanRow[]
): Promise<void> {
  const 行数据 = rows.map((row) => ({
    序号: row.index,
    考试时间: row.time || undefined,
    考试地点: row.location || undefined,
    考试方式: row.method || undefined,
    考试主题: row.scope || undefined,
    考试对象: row.audience || undefined,
    组织人: row.organizer || undefined,
    监考人: row.proctor || undefined,
    需准备资料: row.materials || undefined,
    备注: row.remark || undefined,
  }))

  const planData = {
    神殿名称: campus,
    年份: year,
    月份: month,
    行数据,
  }

  try {
    try {
      await api.get(`/culture-exam/${encodeURIComponent(campus)}/${year}/${month}`)
      // 如果存在，更新
      await api.put(`/culture-exam/${encodeURIComponent(campus)}/${year}/${month}`, { 行数据 })
      console.log(`  ✅ 更新考试计划: ${campus} ${year}年${month}月`)
    } catch (error: any) {
      // 如果不存在（404），创建
      if (error.response?.status === 404) {
        await api.post('/culture-exam/', planData)
        console.log(`  ✅ 创建考试计划: ${campus} ${year}年${month}月`)
      } else {
        throw error
      }
    }
  } catch (error: any) {
    console.error(
      `  ❌ 保存考试计划失败: ${campus} ${year}年${month}月`,
      error.response?.data || error.message,
    )
    throw error
  }
}

// 主测试函数
async function runTest() {
  console.log('='.repeat(60))
  console.log('开始批量插入企业文化数据')
  console.log('='.repeat(60))
  console.log(`配置信息:`)
  console.log(`  神殿: ${TEST_CONFIG.campuses.join(', ')}`)
  console.log(`  年份: ${TEST_CONFIG.years.join(', ')}`)
  console.log(`  月份: ${TEST_CONFIG.months.join(', ')}`)
  console.log(`  每个批次: ${TEST_CONFIG.recordsPerBatch} 条数据`)
  console.log(`  API地址: ${API_BASE_URL}`)
  console.log('='.repeat(60))

  const stats = {
    presentation: { success: 0, failed: 0 },
    exam: { success: 0, failed: 0 },
  }

  // 遍历所有神殿、年份、月份组合
  for (const campus of TEST_CONFIG.campuses) {
    console.log(`\n📌 处理神殿: ${campus}`)

    for (const year of TEST_CONFIG.years) {
      console.log(`  📅 处理年份: ${year}`)

      for (const month of TEST_CONFIG.months) {
        console.log(`    📆 处理月份: ${month}`)

        try {
          // 1. 生成并保存宣讲计划数据
          const presentationRows = generatePresentationPlanRows(
            TEST_CONFIG.recordsPerBatch,
            year,
            month,
          )
          await savePresentationPlan(campus, year, month, presentationRows)
          stats.presentation.success++

          // 2. 生成并保存考试计划数据
          const examRows = generateExamPlanRows(TEST_CONFIG.recordsPerBatch, year, month)
          await saveExamPlan(campus, year, month, examRows)
          stats.exam.success++

          // 添加延迟，避免请求过快
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          stats.presentation.failed++
          stats.exam.failed++
          console.error(`    ❌ 处理失败: ${campus} ${year}年${month}月`)
        }
      }
    }
  }

  // 输出统计信息
  console.log('\n' + '='.repeat(60))
  console.log('测试完成统计')
  console.log('='.repeat(60))
  console.log('宣讲计划表:')
  console.log(`  成功: ${stats.presentation.success} 个批次`)
  console.log(`  失败: ${stats.presentation.failed} 个批次`)
  console.log('考试计划表:')
  console.log(`  成功: ${stats.exam.success} 个批次`)
  console.log(`  失败: ${stats.exam.failed} 个批次`)
  console.log('='.repeat(60))

  const totalBatches = TEST_CONFIG.campuses.length * TEST_CONFIG.years.length * TEST_CONFIG.months.length
  const totalRecords = totalBatches * TEST_CONFIG.recordsPerBatch
  console.log(`\n总计:`)
  console.log(`  批次数量: ${totalBatches} (宣讲计划 + 考试计划)`)
  console.log(`  记录数量: ${totalRecords * 2} 条 (宣讲计划 ${totalRecords} 条 + 考试计划 ${totalRecords} 条)`)
  console.log('='.repeat(60))
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runTest()
    .then(() => {
      console.log('\n🎉 所有数据插入完成！')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ 测试执行失败:', error)
      process.exit(1)
    })
}

export { runTest, generatePresentationPlanRows, generateExamPlanRows }

