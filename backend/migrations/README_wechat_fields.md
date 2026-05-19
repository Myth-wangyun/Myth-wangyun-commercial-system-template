# 微信平台数据表字段更新说明

## 问题描述
微信平台数据表缺少以下字段，导致前端无法保存这些数据：
1. 视频号数据诊断结果均值
2. 视频号完播率
3. 视频号平均播放时长
4. 视频号3s以上播放率
5. 公众号推荐数（推荐人数）
6. 公众号留言数（留言条数）

## 解决方案

### 方法1: 使用批处理脚本（推荐）
双击运行批处理文件：
```
D:\Documents\Desktop\1\qm-system\backend\migrations\run_add_wechat_fields.bat
```

这个脚本会自动：
- 查找可用的Python解释器
- 执行迁移脚本
- 显示执行结果

### 方法2: 直接执行SQL脚本
如果Python环境有问题，可以直接在数据库中执行SQL：

1. 打开数据库管理工具（如Navicat、MySQL Workbench等）
2. 连接到数据库
3. 打开文件：`migrations/add_wechat_missing_fields.sql`
4. 执行SQL脚本

### 方法3: 手动运行Python脚本
在后端目录执行以下命令：

```bash
cd D:\Documents\Desktop\1\qm-system\backend
python migrations/add_wechat_missing_fields.py
```

或者使用Anaconda环境：
```bash
D:\Anaconda\envs\py311\python.exe migrations/add_wechat_missing_fields.py
```

### 2. 已更新的文件

#### 数据库模型 (app/models/market/free_promotion_daily.py)
- ✅ 添加了6个新字段到 `市场部免费推广微信平台日度数据表` 类

#### API接口 (app/api/v1/market/free_promotion_daily.py)
- ✅ 更新了 `/wechat/list` 接口，返回新字段数据
- ✅ 更新了 `/wechat/save` 接口，保存新字段数据
- ✅ 添加了 `_parse_numeric` 函数，处理百分号和后缀

#### 前端组件 (frontend/pages/market/20-Marketing-Free Promotion-Daily-Data/dashboards/WechatDashboard.tsx)
- ✅ 所有字段都已可编辑
- ✅ 完播率和3s以上播放率显示百分号
- ✅ 平均播放时长不显示后缀
- ✅ 汇总行自动计算平均值

### 3. 新增字段详情

| 字段名 | 数据类型 | 说明 |
|--------|---------|------|
| 视频号数据诊断结果均值 | DECIMAL(10,2) | 微信视频号数据诊断结果均值 |
| 视频号完播率 | DECIMAL(10,2) | 微信视频号完播率（百分比） |
| 视频号平均播放时长 | DECIMAL(10,2) | 微信视频号平均播放时长（秒） |
| 视频号3s以上播放率 | DECIMAL(10,2) | 微信视频号3s以上播放率（百分比） |
| 公众号推荐数 | INT | 公众号推荐人数 |
| 公众号留言数 | INT | 公众号留言条数 |

### 4. 验证步骤

1. 运行迁移脚本后，检查数据库表结构：
```sql
DESCRIBE `市场部免费推广微信平台日度数据表`;
```

2. 重启后端服务

3. 在前端页面测试：
   - 打开微信平台数据看板
   - 输入数据到新字段
   - 点击"保存数据"
   - 刷新页面，确认数据已保存
   - 检查汇总行是否正确计算平均值

### 5. 注意事项

- 迁移脚本是幂等的，可以安全地多次运行
- 如果字段已存在，脚本会跳过该字段
- 所有新字段都允许为NULL，不会影响现有数据
- 前端会自动处理百分号和后缀的显示

## 完成后的功能

✅ 数据诊断结果均值 - 可编辑，汇总行显示平均值  
✅ 完播率 - 可编辑，显示百分号，汇总行显示平均值  
✅ 平均播放时长 - 可编辑，不显示后缀，汇总行显示平均值  
✅ 3s以上播放率 - 可编辑，显示百分号，汇总行显示平均值  
✅ 推荐人数 - 可编辑，汇总行显示总和  
✅ 留言条数 - 可编辑，汇总行显示总和  
