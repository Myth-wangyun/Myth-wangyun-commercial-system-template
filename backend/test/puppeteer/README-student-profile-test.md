# 学生档案录入功能自动化测试

这个目录包含了学生档案录入功能的Puppeteer自动化测试代码。

## 📁 文件说明

- `student-profile-input.test.js` - 主要的测试文件，包含完整的测试逻辑
- `test-config.js` - 测试配置和测试数据
- `run-student-profile-test.js` - 简化的测试运行脚本
- `README-student-profile-test.md` - 本说明文件

## 🚀 快速开始

### 1. 安装依赖

```bash
cd qm-mang-sys/test/puppeteer
npm install
```

### 2. 启动服务器

确保前端和后端服务器都在运行：

```bash
# 前端服务器 (端口 3000)
cd qm-mang-sys/frontend
python -m http.server 3000

# 后端服务器 (端口 8000)
cd qm-mang-sys/backend
python main.py
```

### 3. 运行测试

#### 方法一：使用简化脚本（推荐）

```bash
node run-student-profile-test.js
```

#### 方法二：直接运行测试文件

```bash
node student-profile-input.test.js
```

## 🧪 测试内容

测试包含以下功能：

### 1. 登录功能测试
- 自动登录到系统
- 验证登录状态

### 2. 页面导航测试
- 导航到学生档案录入页面
- 验证页面正确显示

### 3. 表单功能测试
- **表单填写**: 填写完整的学生档案信息
- **表单验证**: 测试必填字段验证
- **表单提交**: 测试表单提交功能
- **表单重置**: 测试重置表单功能
- **数据验证**: 测试身份证号格式验证

### 4. 导出功能测试
- 测试Excel导出功能
- 验证导出过程无错误

### 5. 错误处理测试
- 测试无效数据验证
- 测试空表单提交

## ⚙️ 配置选项

在 `test-config.js` 中可以修改以下配置：

### 服务器配置
```javascript
baseUrl: 'http://localhost:3000',  // 前端服务器地址
loginUrl: 'http://localhost:3000/login.html',
mainUrl: 'http://localhost:3000/index.html',
```

### 浏览器配置
```javascript
browser: {
    headless: false,  // 是否无头模式运行
    slowMo: 100,      // 操作延迟（毫秒）
}
```

### 登录配置
```javascript
login: {
    username: 'admin',     // 登录用户名
    password: 'admin123'   // 登录密码
}
```

## 📊 测试数据

测试使用以下数据：

### 有效学生数据
- 姓名: 张三
- 性别: 男
- 入学时间: 2024-01-15
- 专业: 计算机应用技术
- 身份证: 110101199001011234
- 等等...

### 无效数据
- 空姓名（测试必填字段验证）
- 无效身份证号（测试格式验证）

## 🔧 故障排除

### 常见问题

1. **服务器未运行**
   ```
   ❌ 服务器未运行！
   ```
   解决：确保前端和后端服务器都在运行

2. **登录失败**
   ```
   ❌ 登录失败
   ```
   解决：检查用户名和密码是否正确

3. **页面元素未找到**
   ```
   ❌ 页面元素未找到
   ```
   解决：检查页面是否正确加载，可能需要等待更长时间

4. **测试超时**
   ```
   ❌ 测试超时
   ```
   解决：增加超时时间或检查网络连接

### 调试模式

设置 `headless: false` 可以看到浏览器操作过程：

```javascript
browser: {
    headless: false,  // 显示浏览器窗口
    slowMo: 500,      // 增加延迟便于观察
}
```

## 📈 测试报告

测试完成后会显示：
- ✅ 通过的测试数量
- ❌ 失败的测试数量
- 📊 测试执行时间
- 🔍 详细的错误信息

## 🎯 扩展测试

要添加新的测试用例，可以：

1. 在 `student-profile-input.test.js` 中添加新的测试方法
2. 在 `test-config.js` 中添加新的测试数据
3. 在 `runAllTests()` 方法中调用新的测试

## 📝 注意事项

1. 测试前确保服务器正在运行
2. 测试会使用真实的登录凭据
3. 测试过程中会创建测试数据
4. 建议在测试环境中运行，避免影响生产数据
5. 测试完成后会自动清理浏览器资源
