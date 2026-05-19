/**
 * 班级档案学籍统计功能测试示例
 * 
 * 使用方法：
 * 1. 在浏览器控制台中运行此代码
 * 2. 或者创建一个测试页面导入此文件
 */

import { classFileEnrollmentReader } from './classFileEnrollmentReader'

interface ClassFileReaderWindow extends Window {
  testClassFileReader?: (campus: string) => Promise<void>
}

/**
 * 测试1：获取按类别分类的统计
 */
export async function testGetStatsByCategory(campus: string) {
  console.log('=== 测试1：按类别统计 ===')
  console.log('神殿:', campus)
  
  try {
    const stats = await classFileEnrollmentReader.getStatsByCategory(campus)
    
    console.log('\n📊 统计结果：')
    console.log('中专3年:', stats.secondaryThreeYear.length, '人')
    console.log('中专1年:', stats.secondaryOneYear.length, '人')
    console.log('其他中等教育:', stats.secondaryOther.length, '人')
    console.log('成考:', stats.collegeAdultExam.length, '人')
    console.log('国开:', stats.collegeOpenUniv.length, '人')
    console.log('其他高等教育:', stats.collegeOther.length, '人')
    console.log('未注册:', stats.notRegistered.length, '人')
    console.log('未承诺:', stats.notPromised.length, '人')
    
    console.log('\n✅ 测试1通过')
    return stats
  } catch (error) {
    console.error('❌ 测试1失败:', error)
    throw error
  }
}

/**
 * 测试2：获取按班主任分类的统计
 */
export async function testGetStatsByTeacher(campus: string) {
  console.log('\n=== 测试2：按班主任统计 ===')
  console.log('神殿:', campus)
  
  try {
    const stats = await classFileEnrollmentReader.getStatsByTeacher(campus)
    
    console.log('\n👨‍🏫 班主任统计：')
    const teachers = Object.keys(stats)
    console.log('共', teachers.length, '位班主任')
    
    // 显示前5位班主任的统计
    teachers.slice(0, 5).forEach(teacher => {
      const data = stats[teacher]
      const total = 
        data.secondaryThreeYear + 
        data.secondaryOneYear + 
        data.secondaryOther + 
        data.collegeAdultExam + 
        data.collegeOpenUniv + 
        data.collegeOther
      
      console.log(`\n${teacher}:`)
      console.log('  中专:', data.secondaryThreeYear + data.secondaryOneYear + data.secondaryOther, '人')
      console.log('  大学:', data.collegeAdultExam + data.collegeOpenUniv + data.collegeOther, '人')
      console.log('  未注册:', data.notRegistered, '人')
      console.log('  总计:', total, '人')
    })
    
    if (teachers.length > 5) {
      console.log(`\n... 还有 ${teachers.length - 5} 位班主任`)
    }
    
    console.log('\n✅ 测试2通过')
    return stats
  } catch (error) {
    console.error('❌ 测试2失败:', error)
    throw error
  }
}

/**
 * 测试3：获取汇总数据
 */
export async function testGetSummary(campus: string) {
  console.log('\n=== 测试3：获取汇总数据 ===')
  console.log('神殿:', campus)
  
  try {
    const summary = await classFileEnrollmentReader.getSummary(campus)
    
    console.log('\n📈 汇总数据：')
    console.log('中专层次总计:', 
      summary.total.secondaryThreeYear + 
      summary.total.secondaryOneYear + 
      summary.total.secondaryOther, '人')
    console.log('  - 中专3年:', summary.total.secondaryThreeYear, '人')
    console.log('  - 中专1年:', summary.total.secondaryOneYear, '人')
    console.log('  - 其他中等教育:', summary.total.secondaryOther, '人')
    
    console.log('\n大学层次总计:', 
      summary.total.collegeAdultExam + 
      summary.total.collegeOpenUniv + 
      summary.total.collegeOther, '人')
    console.log('  - 成考:', summary.total.collegeAdultExam, '人')
    console.log('  - 国开:', summary.total.collegeOpenUniv, '人')
    console.log('  - 其他高等教育:', summary.total.collegeOther, '人')
    
    console.log('\n其他情况：')
    console.log('  - 未注册:', summary.total.notRegistered, '人')
    console.log('  - 未承诺:', summary.total.notPromised, '人')
    
    console.log('\n✅ 测试3通过')
    return summary
  } catch (error) {
    console.error('❌ 测试3失败:', error)
    throw error
  }
}

/**
 * 测试4：获取所有学生原始数据
 */
export async function testGetAllStudents(campus: string) {
  console.log('\n=== 测试4：获取所有学生数据 ===')
  console.log('神殿:', campus)
  
  try {
    const students = await classFileEnrollmentReader.getAllStudents(campus)
    
    console.log('\n👥 学生数据：')
    console.log('共', students.length, '名学生')
    
    // 显示前3名学生的信息
    console.log('\n示例学生信息（前3名）：')
    students.slice(0, 3).forEach((student, index) => {
      console.log(`\n学生${index + 1}:`)
      console.log('  姓名:', student.name)
      console.log('  班主任:', student.headTeacher || '未分配')
      console.log('  班级:', student.className || '未知')
      console.log('  是否承诺注册:', student.promisedRegisterEducation || '未填写')
      console.log('  承诺级别:', student.promisedEducationLevel || '未填写')
      console.log('  注册状态:', student.registeredSecondaryOrCollege || '未填写')
    })
    
    if (students.length > 3) {
      console.log(`\n... 还有 ${students.length - 3} 名学生`)
    }
    
    console.log('\n✅ 测试4通过')
    return students
  } catch (error) {
    console.error('❌ 测试4失败:', error)
    throw error
  }
}

/**
 * 运行所有测试
 */
export async function runAllTests(campus: string) {
  console.log('🚀 开始测试班级档案学籍统计功能')
  console.log('神殿:', campus)
  console.log('时间:', new Date().toLocaleString())
  console.log('='.repeat(50))
  
  try {
    await testGetStatsByCategory(campus)
    await testGetStatsByTeacher(campus)
    await testGetSummary(campus)
    await testGetAllStudents(campus)
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ 所有测试通过！')
    console.log('='.repeat(50))
  } catch (error) {
    console.log('\n' + '='.repeat(50))
    console.error('❌ 测试失败！')
    console.error(error)
    console.log('='.repeat(50))
  }
}

/**
 * 浏览器控制台快速测试
 * 
 * 使用方法：
 * 1. 打开浏览器开发者工具（F12）
 * 2. 在控制台中输入：
 *    testClassFileReader('盛邦')
 */
if (typeof window !== 'undefined') {
  const testWindow = window as ClassFileReaderWindow
  testWindow.testClassFileReader = async (campus: string) => {
    await runAllTests(campus)
  }
  
  console.log('💡 提示：在控制台中输入 testClassFileReader("神殿名称") 来测试功能')
}

/**
 * 数据验证测试
 */
export async function validateData(campus: string) {
  console.log('\n=== 数据验证测试 ===')
  
  try {
    const students = await classFileEnrollmentReader.getAllStudents(campus)
    
    // 统计各字段的填写情况
    let promisedCount = 0
    let levelCount = 0
    let registeredCount = 0
    
    students.forEach(student => {
      if (student.promisedRegisterEducation) promisedCount++
      if (student.promisedEducationLevel) levelCount++
      if (student.registeredSecondaryOrCollege) registeredCount++
    })
    
    console.log('\n📋 数据完整性：')
    console.log('总学生数:', students.length)
    console.log('填写"是否承诺注册学历":', promisedCount, `(${(promisedCount/students.length*100).toFixed(1)}%)`)
    console.log('填写"承诺注册学历级别":', levelCount, `(${(levelCount/students.length*100).toFixed(1)}%)`)
    console.log('填写"是否已注册中专/大专":', registeredCount, `(${(registeredCount/students.length*100).toFixed(1)}%)`)
    
    // 检查数据规范性
    const invalidLevels = students.filter(s => 
      s.promisedEducationLevel && 
      !['中专1年', '中专3年', '其他中等教育', '成考', '国开', '其他高等教育'].includes(s.promisedEducationLevel)
    )
    
    const invalidStatuses = students.filter(s => 
      s.registeredSecondaryOrCollege && 
      !['已注册中专', '已注册大专', '未注册'].includes(s.registeredSecondaryOrCollege)
    )
    
    if (invalidLevels.length > 0) {
      console.warn('\n⚠️ 发现', invalidLevels.length, '个不规范的"承诺注册学历级别"')
      invalidLevels.slice(0, 3).forEach(s => {
        console.warn('  -', s.name, ':', s.promisedEducationLevel)
      })
    }
    
    if (invalidStatuses.length > 0) {
      console.warn('\n⚠️ 发现', invalidStatuses.length, '个不规范的"是否已注册中专/大专"')
      invalidStatuses.slice(0, 3).forEach(s => {
        console.warn('  -', s.name, ':', s.registeredSecondaryOrCollege)
      })
    }
    
    if (invalidLevels.length === 0 && invalidStatuses.length === 0) {
      console.log('\n✅ 数据规范性检查通过')
    }
    
  } catch (error) {
    console.error('❌ 数据验证失败:', error)
  }
}

// 导出所有测试函数
export default {
  testGetStatsByCategory,
  testGetStatsByTeacher,
  testGetSummary,
  testGetAllStudents,
  runAllTests,
  validateData,
}
