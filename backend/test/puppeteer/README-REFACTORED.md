# Puppeteer 测试重构说明

## 重构概述

本次重构将原本分散在各个测试文件中的配置和数据统一管理，提高了代码的可维护性和一致性。

## 文件结构

```
test/puppeteer/
├── unified-config.js          # 统一配置文件
├── test-data.js               # 统一测试数据文件
├── test-config-validation.js  # 配置验证脚本
├── student-profile-input.test.js    # 学生档案录入测试
├── bulk-insert-statistics.test.js   # 批量插入统计测试
├── quick-campus-data-generator.js   # 快速校区数据生成器
├── run-student-profile-test.js      # 测试运行脚本
└── README-REFACTORED.md       # 本说明文件
```

## 配置文件说明

### unified-config.js
包含所有测试脚本共享的配置：
- **服务器配置**: 前端地址、API 地址、登录页面等
- **浏览器配置**: 无头模式、操作延迟、启动参数、浏览器路径等
- **超时配置**: 各种操作的超时时间
- **登录配置**: 默认登录用户信息

### test-data.js
包含所有测试用例使用的数据：
- **学生档案测试数据**: 有效/无效学生信息
- **校区数据**: 7个校区的列表
- **媒体来源数据**: 11种媒体来源
- **统计数据配置**: 时间范围、数据密度等
- **登录测试数据**: 有效/无效用户信息

## 重构的优势

1. **统一管理**: 所有配置和数据集中管理，便于维护
2. **避免重复**: 消除了配置和数据的重复定义
3. **易于修改**: 修改配置只需在一个地方进行
4. **类型安全**: 统一的配置结构，减少错误
5. **可扩展性**: 新增测试用例时可直接使用现有配置

## 使用方法

### 1. 验证配置
```bash
node test-config-validation.js
```

### 2. 运行测试
```bash
# 学生档案录入测试
node run-student-profile-test.js

# 批量插入统计测试
node bulk-insert-statistics.test.js

# 生成校区数据
node quick-campus-data-generator.js
```

### 3. 自定义配置
修改 `unified-config.js` 中的配置：
```javascript
export const UNIFIED_CONFIG = {
    browser: {
        headless: true,  // 改为 false 可以看到浏览器界面
        slowMo: 0,       // 增加延迟便于观察
        // ... 其他配置
    }
};
```

## 配置项说明

### 浏览器配置
- `headless`: 是否无头模式运行（true/false）
- `slowMo`: 操作延迟时间（毫秒）
- `args`: 浏览器启动参数
- `executablePath`: 浏览器可执行文件路径

### 服务器配置
- `baseUrl`: 前端服务器地址
- `apiBase`: API 服务器地址
- `loginUrl`: 登录页面地址

### 超时配置
- `default`: 默认超时时间
- `navigation`: 页面导航超时时间
- `element`: 元素等待超时时间

## 注意事项

1. **浏览器路径**: 确保 `executablePath` 指向正确的浏览器路径
2. **服务器地址**: 确保前端和后端服务器地址正确
3. **超时设置**: 根据网络情况适当调整超时时间
4. **数据一致性**: 修改测试数据时注意保持数据的一致性

## 故障排除

### 浏览器启动失败
- 检查 `executablePath` 是否正确
- 确认浏览器已安装
- 尝试使用 `headless: true` 模式

### 服务器连接失败
- 检查服务器是否运行
- 确认服务器地址和端口正确
- 检查防火墙设置

### 测试数据问题
- 验证测试数据的格式和内容
- 确保数据符合业务逻辑要求
- 检查必填字段是否完整
