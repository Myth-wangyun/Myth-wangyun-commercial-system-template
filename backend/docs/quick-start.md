# 快速开始指南

## 🚀 系统部署

### 环境要求
- **Python**: 3.8+
- **MySQL**: 8.0+
- **Node.js**: 14+ (可选，用于前端开发)
- **操作系统**: Windows 10/11, macOS, Linux

### 1. 克隆项目
```bash
git clone <项目地址>
cd qm-mang-sys
```

### 2. 安装Python依赖
```bash
pip install -r backend/requirements.txt
```

### 3. 配置数据库
```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE 市场 CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

# 导入数据库结构
mysql -u root -p 市场 < sql/create_table.sql
mysql -u root -p 市场 < sql/create_statistics_views.sql
```

### 4. 配置环境变量
```bash
# 复制环境配置文件
cp backend/env.example backend/.env

# 编辑配置文件
# 设置数据库连接信息
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=市场
```

### 5. 启动系统

#### 方法一：使用启动脚本（推荐）
```bash
# Windows PowerShell
.\start.ps1

# 或者手动启动
python -m http.server 3000 --directory .\qm-mang-sys\fronted\
python qm-mang-sys\backend\main.py
```

#### 方法二：分别启动
```bash
# 启动前端服务器（终端1）
python -m http.server 3000 --directory fronted/

# 启动后端服务器（终端2）
python backend/main.py
```

### 6. 访问系统
- **前端界面**: http://localhost:3000
- **API文档**: http://localhost:8000/docs
- **后端接口**: http://localhost:8000

## 📊 数据初始化

### 1. 导入示例数据
```bash
# 导入基础数据
mysql -u root -p 市场 < sql/create_partner_table.sql

# 生成测试数据（可选）
python test/generate_realistic_data.py
```

### 2. 验证数据
```bash
# 运行数据验证脚本
python test/test_statistics_fix.py
```

## 🎯 功能使用

### 1. 日投放数据登记
1. 访问 http://localhost:3000
2. 点击"日投放数据登记"
3. 查看统计卡片了解数据概况
4. 使用筛选功能查看特定数据
5. 点击"添加数据"录入新数据

### 2. 统计分析
1. 点击"统计分析"菜单
2. 选择统计周期（日/周/月/年）
3. 查看图表和趋势分析
4. 使用筛选条件分析特定数据

### 3. 合作方管理
1. 点击"合作方联系方式"
2. 查看合作方列表
3. 使用搜索和筛选功能
4. 添加、编辑或删除合作方信息

### 4. 校区信息
1. 点击"校区信息"
2. 查看各校区基本信息
3. 了解校区分布和联系方式

## 🔧 开发调试

### 1. 后端调试
```bash
# 启动调试模式
python backend/main.py --debug

# 查看API文档
# 访问 http://localhost:8000/docs
```

### 2. 前端调试
```bash
# 使用浏览器开发者工具
# F12 打开控制台查看错误信息
# Network 标签查看API请求
```

### 3. 数据库调试
```bash
# 连接数据库
mysql -u root -p 市场

# 查看表结构
DESCRIBE 投放明细表;
DESCRIBE 合作方联系方式表;

# 查看数据
SELECT COUNT(*) FROM 投放明细表;
SELECT * FROM 合作方联系方式表 LIMIT 5;
```

## 🚨 常见问题

### 1. 端口占用
```bash
# 检查端口占用
netstat -an | findstr :3000
netstat -an | findstr :8000

# 终止占用进程
taskkill /f /im python.exe
```

### 2. 数据库连接失败
- 检查MySQL服务是否启动
- 验证数据库连接配置
- 确认数据库用户权限

### 3. 前端页面无法访问
- 检查前端服务器是否启动
- 确认端口3000是否可用
- 查看浏览器控制台错误信息

### 4. API请求失败
- 检查后端服务器是否启动
- 确认端口8000是否可用
- 查看后端日志错误信息

## 📝 开发工具推荐

### 代码编辑
- **VS Code**: 推荐使用，支持Python和JavaScript
- **PyCharm**: Python开发专业IDE
- **WebStorm**: 前端开发专业IDE

### 数据库管理
- **MySQL Workbench**: 官方数据库管理工具
- **Navicat**: 第三方数据库管理工具
- **phpMyAdmin**: Web版数据库管理

### API测试
- **Postman**: API接口测试工具
- **Insomnia**: 轻量级API测试工具
- **curl**: 命令行API测试

## 🔄 更新维护

### 1. 代码更新
```bash
# 拉取最新代码
git pull origin main

# 重启服务
# 停止当前服务，重新运行启动脚本
```

### 2. 数据库更新
```bash
# 备份数据库
mysqldump -u root -p 市场 > backup.sql

# 执行数据库更新脚本
mysql -u root -p 市场 < sql/update_script.sql
```

### 3. 依赖更新
```bash
# 更新Python依赖
pip install -r backend/requirements.txt --upgrade

# 更新npm依赖（如果有）
npm update
```

## 📞 获取帮助

### 文档资源
- [项目简介](project-overview.md)
- [系统架构](architecture.md)
- [API文档](api/README.md)
- [常见问题](troubleshooting/faq.md)

### 技术支持
- 查看系统日志文件
- 检查浏览器控制台错误
- 参考API文档和代码注释
- 提交Issue获取技术支持

---

## ✅ 验证清单

部署完成后，请验证以下功能：

- [ ] 前端页面正常访问 (http://localhost:3000)
- [ ] 后端API正常响应 (http://localhost:8000/docs)
- [ ] 数据库连接正常
- [ ] 日投放数据登记功能正常
- [ ] 统计分析功能正常
- [ ] 合作方管理功能正常
- [ ] 校区信息展示正常

---

*按照本指南，您应该能够成功部署和运行清美教育管理系统。如有问题，请参考常见问题部分或联系技术支持。*
