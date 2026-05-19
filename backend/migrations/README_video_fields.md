# 视频日度数据表字段添加说明

## 概述
为视频数据看板添加4个缺失的数据库字段，以支持完整的数据录入和展示功能。

## 缺失字段

### 优酷部分
1. **优酷分享量** (`优酷分享量`)
   - 类型: `INTEGER`
   - 默认值: `0`
   - 对应前端字段: `youkuShareCount`

2. **优酷粉丝数** (`优酷粉丝数`)
   - 类型: `INTEGER`
   - 默认值: `0`
   - 对应前端字段: `youkuFansCount`

### 爱奇艺部分
3. **爱奇艺总播放时长** (`爱奇艺总播放时长`)
   - 类型: `NUMERIC(10, 2)`
   - 单位: 秒
   - 对应前端字段: `iqiyiPlayDurationTotal`

4. **爱奇艺总播放完成率** (`爱奇艺总播放完成率`)
   - 类型: `NUMERIC(10, 2)`
   - 单位: 百分比
   - 对应前端字段: `iqiyiCompletionRateTotal`

## 执行步骤

### 1. 运行数据库迁移

#### 方法一：使用批处理文件（推荐）
```bash
cd backend/migrations
run_add_video_fields.bat
```

#### 方法二：直接运行Python脚本
```bash
cd backend
python migrations/add_video_missing_fields.py
```

### 2. 重启后端服务
```bash
# 停止当前运行的后端服务
# 然后重新启动
cd backend
python main.py
```

### 3. 验证字段是否添加成功
迁移脚本会自动验证字段是否添加成功，并显示字段信息。

## 修改的文件

### 1. 数据库模型
- `backend/app/models/market/free_promotion_daily.py`
  - 在 `市场部免费推广视频日度数据表` 类中添加了4个字段定义

### 2. API接口
- `backend/app/api/v1/market/free_promotion_daily.py`
  - 更新 `/video/list` 接口：返回新增的4个字段
  - 更新 `/video/save` 接口：支持保存新增的4个字段

### 3. 迁移脚本
- `backend/migrations/add_video_missing_fields.py` - Python迁移脚本
- `backend/migrations/run_add_video_fields.bat` - 批处理执行文件

## 前端字段映射

| 前端字段 | 数据库字段 | 类型 | 说明 |
|---------|-----------|------|------|
| `youkuShareCount` | `优酷分享量` | INTEGER | 优酷分享数 |
| `youkuFansCount` | `优酷粉丝数` | INTEGER | 优酷粉丝数 |
| `iqiyiPlayDurationTotal` | `爱奇艺总播放时长` | NUMERIC(10,2) | 爱奇艺总播放时长(秒) |
| `iqiyiCompletionRateTotal` | `爱奇艺总播放完成率` | NUMERIC(10,2) | 爱奇艺总播放完成率(%) |

## 注意事项

1. **数据类型**
   - 整数字段（分享量、粉丝数）使用 `INTEGER` 类型
   - 小数字段（播放时长、完成率）使用 `NUMERIC(10, 2)` 类型

2. **前端处理**
   - 播放时长：前端以字符串形式显示，不带单位后缀
   - 完成率：前端以字符串形式显示，带 `%` 后缀
   - 后端API会自动处理百分号的添加和移除

3. **数据验证**
   - 迁移完成后，请在前端测试数据的录入和保存
   - 确认汇总行的平均值计算正确

## 测试清单

- [ ] 数据库字段添加成功
- [ ] 后端服务重启成功
- [ ] 前端可以正常显示这4个字段
- [ ] 可以输入并保存数据
- [ ] 刷新页面后数据正确显示
- [ ] 汇总行的平均值计算正确

## 问题排查

如果遇到问题，请检查：

1. **数据库连接**
   - 确认 `.env` 文件中的数据库配置正确
   - 确认数据库服务正在运行

2. **字段是否存在**
   ```sql
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_schema = 'market'
   AND table_name = '市场部免费推广视频日度数据表'
   AND column_name IN ('优酷分享量', '优酷粉丝数', '爱奇艺总播放时长', '爱奇艺总播放完成率');
   ```

3. **后端日志**
   - 查看后端控制台输出
   - 检查是否有错误信息

## 完成时间
2026-02-09

