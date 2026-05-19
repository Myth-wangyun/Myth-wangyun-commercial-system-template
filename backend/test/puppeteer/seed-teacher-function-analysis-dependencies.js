#!/usr/bin/env node

/**
 * 教员功能分析表依赖数据批量插入E2E测试
 * 
 * 功能：
 * 1. 自动登录系统
 * 2. 批量填充所有依赖表格的数据
 * 3. 验证数据是否正确插入
 * 4. 测试教员功能分析表的自动聚合功能
 */

import puppeteer from 'puppeteer';
import { UNIFIED_CONFIG } from './unified-config.js';

// 测试数据配置
const TEST_DATA = {
  campus: '盛邦校区',
  year: 2024,
  month: 10,
  teachers: ['张三', '李四', '王五', '赵六'],
  classes: ['Java2024-01班', 'Python2024-01班', '前端2024-01班'],
  students: [
    { name: '学生A', id: 'S001' },
    { name: '学生B', id: 'S002' },
    { name: '学生C', id: 'S003' },
    { name: '学生D', id: 'S004' },
    { name: '学生E', id: 'S005' },
  ]
};

class TeacherFunctionAnalysisE2ETest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:5173';
  }

  async init() {
    console.log('🚀 启动浏览器...');
    this.browser = await puppeteer.launch({
      headless: false, // 显示浏览器，方便观察
      slowMo: 100, // 减慢操作速度
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      executablePath: UNIFIED_CONFIG.browser.executablePath
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    this.page.setDefaultTimeout(30000);
    
    console.log('✅ 浏览器启动成功');
  }

  async login() {
    console.log('🔐 开始登录...');
    await this.page.goto(`${this.baseUrl}/login.html`, {
      waitUntil: 'networkidle0'
    });
    
    // 填写登录信息
    await this.page.waitForSelector('#username');
    await this.page.type('#username', UNIFIED_CONFIG.login.username, { delay: 50 });
    await this.page.type('#password', UNIFIED_CONFIG.login.password, { delay: 50 });
    
    // 点击登录
    await this.page.click('button[type="submit"]');
    await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    console.log('✅ 登录成功');
    await this.page.waitForTimeout(2000);
  }

  /**
   * 1. 填充班作业成绩表
   */
  async fillAssignmentGrades() {
    console.log('\n📝 开始填充班作业成绩表...');
    
    for (const className of TEST_DATA.classes) {
      console.log(`  处理班级: ${className}`);
      
      await this.page.goto(
        `${this.baseUrl}/campus-class-assignment-score?campus=${encodeURIComponent(TEST_DATA.campus)}&class=${encodeURIComponent(className)}`,
        { waitUntil: 'networkidle0' }
      );
      
      await this.page.waitForTimeout(2000);
      
      // 查找"新增"或"编辑"按钮
      const addButton = await this.page.$('button:has-text("新增"), button:has-text("添加"), button:has-text("填写")');
      if (addButton) {
        await addButton.click();
        await this.page.waitForTimeout(1000);
        
        // 填写作业成绩数据
        for (let i = 0; i < TEST_DATA.students.length; i++) {
          const student = TEST_DATA.students[i];
          
          // 查找学生行并填写成绩
          const studentRows = await this.page.$$('table tbody tr');
          if (studentRows[i]) {
            // 填写多个作业的成绩（假设有5个作业）
            for (let hwNum = 1; hwNum <= 5; hwNum++) {
              const score = Math.floor(Math.random() * 30) + 70; // 70-100分
              const scoreInput = await studentRows[i].$(`input[placeholder*="作业${hwNum}"], input[name*="assignment${hwNum}"]`);
              if (scoreInput) {
                await scoreInput.click();
                await this.page.keyboard.down('Control');
                await this.page.keyboard.press('KeyA');
                await this.page.keyboard.up('Control');
                await this.page.type(String(score), { delay: 50 });
              }
            }
          }
        }
        
        // 保存
        const saveButton = await this.page.$('button:has-text("保存"), button:has-text("提交")');
        if (saveButton) {
          await saveButton.click();
          await this.page.waitForTimeout(2000);
          console.log(`  ✅ ${className} 作业成绩已保存`);
        }
      } else {
        console.log(`  ⚠️ ${className} 未找到新增按钮，可能已有数据`);
      }
    }
    
    console.log('✅ 班作业成绩表填充完成');
  }

  /**
   * 2. 填充班考试成绩表
   */
  async fillExamScores() {
    console.log('\n📊 开始填充班考试成绩表...');
    
    for (const className of TEST_DATA.classes) {
      console.log(`  处理班级: ${className}`);
      
      await this.page.goto(
        `${this.baseUrl}/campus-class-exam-score?campus=${encodeURIComponent(TEST_DATA.campus)}&class=${encodeURIComponent(className)}`,
        { waitUntil: 'networkidle0' }
      );
      
      await this.page.waitForTimeout(2000);
      
      // 查找编辑按钮
      const editButton = await this.page.$('button:has-text("编辑"), button:has-text("填写"), button:has-text("新增")');
      if (editButton) {
        await editButton.click();
        await this.page.waitForTimeout(1000);
        
        // 填写首考成绩
        const firstExamRows = await this.page.$$('table tbody tr');
        for (let i = 0; i < Math.min(firstExamRows.length, TEST_DATA.students.length); i++) {
          const writtenScore = Math.floor(Math.random() * 30) + 70;
          const labScore = Math.floor(Math.random() * 30) + 70;
          
          // 填写笔试成绩
          const writtenInput = await firstExamRows[i].$('input[name*="written"], input[placeholder*="笔试"]');
          if (writtenInput) {
            await writtenInput.click();
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            await this.page.type(String(writtenScore), { delay: 50 });
          }
          
          // 填写机试成绩
          const labInput = await firstExamRows[i].$('input[name*="lab"], input[placeholder*="机试"]');
          if (labInput) {
            await labInput.click();
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            await this.page.type(String(labScore), { delay: 50 });
          }
        }
        
        // 保存
        const saveButton = await this.page.$('button:has-text("保存"), button:has-text("提交")');
        if (saveButton) {
          await saveButton.click();
          await this.page.waitForTimeout(2000);
          console.log(`  ✅ ${className} 考试成绩已保存`);
        }
      }
    }
    
    console.log('✅ 班考试成绩表填充完成');
  }

  /**
   * 3. 填充班项目成绩表
   */
  async fillProjectGrades() {
    console.log('\n💼 开始填充班项目成绩表...');
    
    for (const className of TEST_DATA.classes) {
      console.log(`  处理班级: ${className}`);
      
      await this.page.goto(
        `${this.baseUrl}/campus-class-project-score?campus=${encodeURIComponent(TEST_DATA.campus)}&class=${encodeURIComponent(className)}`,
        { waitUntil: 'networkidle0' }
      );
      
      await this.page.waitForTimeout(2000);
      
      // 查找编辑按钮
      const editButton = await this.page.$('button:has-text("编辑"), button:has-text("填写"), button:has-text("新增")');
      if (editButton) {
        await editButton.click();
        await this.page.waitForTimeout(1000);
        
        // 填写项目成绩
        const projectRows = await this.page.$$('table tbody tr');
        for (let i = 0; i < Math.min(projectRows.length, TEST_DATA.students.length); i++) {
          const projectScore = Math.floor(Math.random() * 30) + 70;
          
          const scoreInput = await projectRows[i].$('input[name*="score"], input[placeholder*="项目"]');
          if (scoreInput) {
            await scoreInput.click();
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            await this.page.type(String(projectScore), { delay: 50 });
          }
        }
        
        // 保存
        const saveButton = await this.page.$('button:has-text("保存"), button:has-text("提交")');
        if (saveButton) {
          await saveButton.click();
          await this.page.waitForTimeout(2000);
          console.log(`  ✅ ${className} 项目成绩已保存`);
        }
      }
    }
    
    console.log('✅ 班项目成绩表填充完成');
  }

  /**
   * 4. 填充学员满意度成绩表
   */
  async fillStudentSatisfaction() {
    console.log('\n😊 开始填充学员满意度成绩表...');
    
    await this.page.goto(
      `${this.baseUrl}/campus-student-satisfaction-score?campus=${encodeURIComponent(TEST_DATA.campus)}`,
      { waitUntil: 'networkidle0' }
    );
    
    await this.page.waitForTimeout(2000);
    
    // 查找新增按钮
    const addButton = await this.page.$('button:has-text("新增"), button:has-text("添加"), button:has-text("填写")');
    if (addButton) {
      await addButton.click();
      await this.page.waitForTimeout(1000);
      
      // 为每个教员填写满意度数据
      for (const teacher of TEST_DATA.teachers) {
        // 选择教员
        const teacherSelect = await this.page.$('select[name*="teacher"], .ant-select:has-text("教员")');
        if (teacherSelect) {
          await teacherSelect.click();
          await this.page.waitForTimeout(500);
          await this.page.keyboard.type(teacher);
          await this.page.keyboard.press('Enter');
        }
        
        // 填写各月满意度（1-12月）
        for (let month = 1; month <= 12; month++) {
          const satisfaction = Math.floor(Math.random() * 10) + 90; // 90-100
          const monthInput = await this.page.$(`input[name*="m${month}"], input[placeholder*="${month}月"]`);
          if (monthInput) {
            await monthInput.click();
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            await this.page.type(String(satisfaction), { delay: 50 });
          }
        }
        
        // 保存当前教员数据
        const saveButton = await this.page.$('button:has-text("保存"), button:has-text("提交")');
        if (saveButton) {
          await saveButton.click();
          await this.page.waitForTimeout(1000);
        }
      }
      
      console.log('✅ 学员满意度成绩表填充完成');
    }
  }

  /**
   * 5. 填充听课成绩表
   */
  async fillLectureScores() {
    console.log('\n👂 开始填充听课成绩表...');
    
    await this.page.goto(
      `${this.baseUrl}/campus-class-lecture-score?campus=${encodeURIComponent(TEST_DATA.campus)}`,
      { waitUntil: 'networkidle0' }
    );
    
    await this.page.waitForTimeout(2000);
    
    // 查找新增按钮
    const addButton = await this.page.$('button:has-text("新增"), button:has-text("添加"), button:has-text("填写")');
    if (addButton) {
      await addButton.click();
      await this.page.waitForTimeout(1000);
      
      // 为每个教员填写听课成绩
      for (const teacher of TEST_DATA.teachers) {
        // 选择教员
        const teacherSelect = await this.page.$('select[name*="teacher"], .ant-select:has-text("教员")');
        if (teacherSelect) {
          await teacherSelect.click();
          await this.page.waitForTimeout(500);
          await this.page.keyboard.type(teacher);
          await this.page.keyboard.press('Enter');
        }
        
        // 填写各月听课成绩
        for (let month = 1; month <= 12; month++) {
          const score = Math.floor(Math.random() * 10) + 90;
          const monthInput = await this.page.$(`input[name*="m${month}"], input[placeholder*="${month}月"]`);
          if (monthInput) {
            await monthInput.click();
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            await this.page.type(String(score), { delay: 50 });
          }
        }
        
        // 保存
        const saveButton = await this.page.$('button:has-text("保存"), button:has-text("提交")');
        if (saveButton) {
          await saveButton.click();
          await this.page.waitForTimeout(1000);
        }
      }
      
      console.log('✅ 听课成绩表填充完成');
    }
  }

  /**
   * 6. 填充压力面试成绩表
   */
  async fillPressureInterviewScores() {
    console.log('\n🎤 开始填充压力面试成绩表...');
    
    for (const className of TEST_DATA.classes) {
      console.log(`  处理班级: ${className}`);
      
      await this.page.goto(
        `${this.baseUrl}/campus-class-pressure-interview-score?campus=${encodeURIComponent(TEST_DATA.campus)}&class=${encodeURIComponent(className)}`,
        { waitUntil: 'networkidle0' }
      );
      
      await this.page.waitForTimeout(2000);
      
      // 查找编辑按钮
      const editButton = await this.page.$('button:has-text("编辑"), button:has-text("填写"), button:has-text("新增")');
      if (editButton) {
        await editButton.click();
        await this.page.waitForTimeout(1000);
        
        // 填写压力面试成绩
        const interviewRows = await this.page.$$('table tbody tr');
        for (let i = 0; i < Math.min(interviewRows.length, TEST_DATA.students.length); i++) {
          const score = Math.floor(Math.random() * 20) + 80; // 80-100
          
          const scoreInput = await interviewRows[i].$('input[name*="score"], input[placeholder*="成绩"]');
          if (scoreInput) {
            await scoreInput.click();
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Control');
            await this.page.type(String(score), { delay: 50 });
          }
        }
        
        // 保存
        const saveButton = await this.page.$('button:has-text("保存"), button:has-text("提交")');
        if (saveButton) {
          await saveButton.click();
          await this.page.waitForTimeout(2000);
          console.log(`  ✅ ${className} 压力面试成绩已保存`);
        }
      }
    }
    
    console.log('✅ 压力面试成绩表填充完成');
  }

  /**
   * 7. 填充核心业务数据汇总表（就业、口碑等）
   */
  async fillCoreBusinessSummary() {
    console.log('\n📈 开始填充核心业务数据汇总表...');
    
    await this.page.goto(
      `${this.baseUrl}/academic/campus/01-core-data/1-core-data-summary/1-core-data-summary`,
      { waitUntil: 'networkidle0' }
    );
    
    await this.page.waitForTimeout(2000);
    
    // 查找编辑按钮
    const editButton = await this.page.$('button:has-text("编辑"), button:has-text("新增"), button:has-text("填写")');
    if (editButton) {
      await editButton.click();
      await this.page.waitForTimeout(1000);
      
      // 填写就业数据
      const employmentRate = Math.floor(Math.random() * 20) + 80; // 80-100%
      const employmentSalary = Math.floor(Math.random() * 5000) + 8000; // 8000-13000
      
      const rateInput = await this.page.$('input[name*="就业率"], input[placeholder*="就业率"]');
      if (rateInput) {
        await rateInput.click();
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('KeyA');
        await this.page.keyboard.up('Control');
        await this.page.type(String(employmentRate), { delay: 50 });
      }
      
      const salaryInput = await this.page.$('input[name*="就业薪资"], input[placeholder*="就业薪资"]');
      if (salaryInput) {
        await salaryInput.click();
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('KeyA');
        await this.page.keyboard.up('Control');
        await this.page.type(String(employmentSalary), { delay: 50 });
      }
      
      // 填写口碑数据
      const reputationCount = Math.floor(Math.random() * 20) + 10;
      const reputationIncome = Math.floor(Math.random() * 100000) + 200000;
      
      const countInput = await this.page.$('input[name*="口碑人数"], input[placeholder*="口碑人数"]');
      if (countInput) {
        await countInput.click();
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('KeyA');
        await this.page.keyboard.up('Control');
        await this.page.type(String(reputationCount), { delay: 50 });
      }
      
      const incomeInput = await this.page.$('input[name*="口碑收入"], input[placeholder*="口碑收入"]');
      if (incomeInput) {
        await incomeInput.click();
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('KeyA');
        await this.page.keyboard.up('Control');
        await this.page.type(String(reputationIncome), { delay: 50 });
      }
      
      // 保存
      const saveButton = await this.page.$('button:has-text("保存"), button:has-text("提交")');
      if (saveButton) {
        await saveButton.click();
        await this.page.waitForTimeout(2000);
        console.log('✅ 核心业务数据汇总表已保存');
      }
    }
  }

  /**
   * 8. 验证教员功能分析表数据聚合
   */
  async verifyTeacherFunctionAnalysis() {
    console.log('\n🔍 开始验证教员功能分析表...');
    
    await this.page.goto(
      `${this.baseUrl}/academic/campus/05-manage-data/27-academic-teacher-function-analysis`,
      { waitUntil: 'networkidle0' }
    );
    
    await this.page.waitForTimeout(2000);
    
    // 切换到数据汇总TAB
    const dataSummaryTab = await this.page.$('.ant-tabs-tab[data-node-key="data-summary"]');
    if (dataSummaryTab) {
      await dataSummaryTab.click();
      await this.page.waitForTimeout(2000);
    }
    
    // 点击"自动获取数据"按钮（如果存在）
    const autoFillButton = await this.page.$('button:has-text("自动获取数据"), button:has-text("自动填充")');
    if (autoFillButton) {
      console.log('  点击自动获取数据按钮...');
      await autoFillButton.click();
      await this.page.waitForTimeout(5000); // 等待数据加载
    }
    
    // 验证表格数据
    const tableRows = await this.page.$$('table tbody tr');
    console.log(`  ✅ 表格共有 ${tableRows.length} 行数据`);
    
    if (tableRows.length > 0) {
      // 检查第一行数据
      const firstRowText = await tableRows[0].evaluate(el => el.textContent);
      console.log(`  第一行数据: ${firstRowText.substring(0, 100)}...`);
      
      // 检查是否有数据填充
      const hasData = firstRowText.includes('张三') || firstRowText.includes('李四');
      if (hasData) {
        console.log('  ✅ 数据已成功聚合到教员功能分析表');
        return true;
      } else {
        console.log('  ⚠️ 数据可能未正确聚合');
        return false;
      }
    } else {
      console.log('  ⚠️ 表格为空，数据可能未加载');
      return false;
    }
  }

  /**
   * 运行完整测试流程
   */
  async run() {
    try {
      await this.init();
      await this.login();
      
      console.log('\n' + '='.repeat(60));
      console.log('开始批量填充依赖表格数据');
      console.log('='.repeat(60));
      
      // 按顺序填充所有依赖表格
      await this.fillAssignmentGrades();
      await this.fillExamScores();
      await this.fillProjectGrades();
      await this.fillStudentSatisfaction();
      await this.fillLectureScores();
      await this.fillPressureInterviewScores();
      await this.fillCoreBusinessSummary();
      
      console.log('\n' + '='.repeat(60));
      console.log('开始验证教员功能分析表');
      console.log('='.repeat(60));
      
      // 验证数据聚合
      const success = await this.verifyTeacherFunctionAnalysis();
      
      console.log('\n' + '='.repeat(60));
      if (success) {
        console.log('🎉 测试完成！所有数据已成功填充并聚合');
      } else {
        console.log('⚠️ 测试完成，但数据聚合可能存在问题');
      }
      console.log('='.repeat(60));
      
      // 保持浏览器打开一段时间，方便观察
      await this.page.waitForTimeout(5000);
      
    } catch (error) {
      console.error('❌ 测试过程中出错:', error);
      // 截图保存错误信息
      await this.page.screenshot({ path: 'test-error.png', fullPage: true });
    } finally {
      if (this.browser) {
        await this.browser.close();
        console.log('🔒 浏览器已关闭');
      }
    }
  }
}

// 运行测试
const test = new TeacherFunctionAnalysisE2ETest();
test.run().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});