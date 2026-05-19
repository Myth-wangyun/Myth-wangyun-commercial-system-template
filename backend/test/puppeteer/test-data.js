// 测试数据文件
// 包含所有测试用例使用的数据

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

// 校区数据
export const CAMPUS_DATA = {
    campuses: [
        '盛邦校区', '冀美校区', '石美校区', '晋美校区', 
        '原美校区', '太美校区', '桂美校区'
    ]
};

// 媒体来源数据
export const MEDIA_SOURCE_DATA = {
    mediaSources: [
        '百度推广', '中心来电', '其他网络', 'TQ', '网络', 
        '网络渠道', '教学口碑', '在校生口碑', '毕业生口碑', 
        '市场口碑', '咨询师口碑'
    ]
};

// 统计数据生成配置
export const STATISTICS_DATA_CONFIG = {
    // 时间范围
    timeRange: {
        startDate: '2020-01-01',
        endDate: '2025-10-20'
    },
    
    // 数据密度
    dataDensity: {
        recordsPerMonth: { min: 3, max: 5 }
    },
    
    // 数据范围
    dataRanges: {
        impression: { min: 10000, max: 60000 },
        clickRate: { min: 0.02, max: 0.08 },
        costPerClick: { min: 1, max: 6 }
    }
};

// 登录测试数据
export const LOGIN_TEST_DATA = {
    validUsers: [
        {
            username: 'wangzexi',
            password: 'wangzexi123456',
            role: 'admin'
        },
        {
            username: 'admin',
            password: 'admin123',
            role: 'admin'
        }
    ],
    
    invalidUsers: [
        {
            username: 'wronguser',
            password: 'wrongpass',
            expectedError: '用户名或密码错误'
        }
    ]
};

// 导出所有数据的默认对象
export const ALL_TEST_DATA = {
    studentProfile: STUDENT_PROFILE_TEST_DATA,
    campus: CAMPUS_DATA,
    mediaSource: MEDIA_SOURCE_DATA,
    statistics: STATISTICS_DATA_CONFIG,
    login: LOGIN_TEST_DATA
};
