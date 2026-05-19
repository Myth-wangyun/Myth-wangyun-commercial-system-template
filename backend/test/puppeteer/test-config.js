// Puppeteer测试配置文件
// 统一管理测试配置和测试数据

export const TEST_CONFIG = {
    // 服务器配置
    baseUrl: 'http://localhost:3000',
    loginUrl: 'http://localhost:3000/login.html',
    mainUrl: 'http://localhost:3000/index.html',
    
    // 浏览器配置
    browser: {
        headless: true, // 设置为true可以无头模式运行
        slowMo: 100, // 减慢操作速度，便于观察
        args: ['--no-sandbox', '--disable-setuid-sandbox']
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

// 学生档案录入测试数据
export const STUDENT_PROFILE_TEST_DATA = {
    validStudent: {
        // 基本信息
        studentName: '张三',
        gender: '男',
        enrollmentDate: '2024-01-15',
        enrollmentAge: '20',
        campusSource: '网络推广',
        consultant: '李老师',
        tuitionAmount: '15000',
        idCard: '110101199001011234',
        major: '计算机应用技术',
        duration: '3年',
        classTeacher: '王老师',
        studentStatus: '在读',
        
        // 学历信息
        education: '高中',
        previousMajor: '理科',
        graduationSchool: '北京第一中学',
        highestCertificate: '高中毕业证',
        
        // 联系方式
        phone: '13800138000',
        parentPhone: '13900139000',
        address: '北京市朝阳区某某街道123号',
        householdType: '城镇',
        studyMode: '全日制',
        currentAddress: '北京市朝阳区某某街道123号',
        
        // 学历注册信息
        promiseRegistration: '是',
        promiseRegistrationType: '大专',
        hasRegistered: '是',
        registeredSchool: '北京开放大学',
        
        // 备注
        remarks: '测试学生档案录入功能'
    },
    
    invalidStudent: {
        studentName: '', // 空姓名，用于测试必填字段验证
        gender: '男',
        enrollmentDate: '2024-01-15',
        major: '计算机应用技术'
    },
    
    invalidIdCard: {
        studentName: '测试学生',
        gender: '男',
        enrollmentDate: '2024-01-15',
        major: '计算机应用技术',
        idCard: '123456789' // 无效的身份证号
    }
};

// 测试用例配置
export const TEST_CASES = {
    studentProfileInput: {
        name: '学生档案录入功能测试',
        description: '测试学生档案录入的完整流程',
        testFile: 'student-profile-input.test.js',
        enabled: true
    }
};
export const BROWSER_CONFIG = {
    headless: true,
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    // 添加正确的 Chromium 路径
    executablePath: '/snap/bin/chromium'
};

// 测试报告配置
export const REPORT_CONFIG = {
    outputDir: './test-results',
    screenshotOnFailure: true,
    videoRecording: false,
    generateHtmlReport: true
};

