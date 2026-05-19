# 各校区新媒体和SEM报表 - 数据库字段缺失问题解决方案

## 问题描述

访问各校区新媒体和SEM报表时，后端返回500错误：

```
psycopg.errors.UndefinedColumn: 字段 咨询量明细表_v2.最近追访时间 不存在
```

**原因**: ORM模型中定义了`最近追访时间`和`追访记录`字段，但数据库表中尚未添加这些字段。

## 解决步骤

### 步骤1: 运行数据库迁移脚本

在后端目录运行以下命令：

```powershell
cd d:\Documents\Desktop\1\qm-system\backend
python migrations\add_follow_up_fields.py
```

按提示输入 `yes` 确认执行。

### 步骤2: 验证字段添加成功

脚本会自动验证，或手动在数据库中查询：

```sql
-- 查看咨询量明细表_v2
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'consult' 
AND table_name = '咨询量明细表_v2' 
AND column_name IN ('最近追访时间', '追访记录');

-- 查看咨询量主表
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'consult' 
AND table_name = '咨询量主表' 
AND column_name IN ('最后追访时间', '保护期状态', '释放时间');
```

### 步骤3: 重启后端服务

```powershell
# 停止后端（Ctrl+C）
# 重新启动
cd d:\Documents\Desktop\1\qm-system\backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 步骤4: 测试API

访问以下URL测试数据加载：

```
http://localhost:8000/api/v1/consult/consultation/records?campus=河北盛邦校区&source=网络&media_source=新媒体平台&start_date=2026-01-01&end_date=2026-01-31&page=1&page_size=50
```

## 已修改的文件

### 前端文件
1. **api.ts** - 新建API文件
   - 路径: `frontend/pages/market/9-market_network_consultant_report/api.ts`
   - 功能: 封装咨询量查询API
   - 修改: 设置正确的查询参数（量来源="网络"，媒体来源="新媒体平台"或"常规SEM平台"）

2. **CampusNewMediaSEMTab.tsx** - 修改查询逻辑
   - 路径: `frontend/pages/market/9-market_network_consultant_report/CampusNewMediaSEMTab.tsx`
   - 修改: 
     - 量来源固定为"网络"
     - 媒体来源根据渠道选择映射为"新媒体平台"或"常规SEM平台"
     - 改为只读显示模式

### 后端文件
3. **add_follow_up_fields.py** - 数据库迁移脚本
   - 路径: `backend/migrations/add_follow_up_fields.py`
   - 功能: 添加追访相关字段到数据库

4. **README_add_follow_up_fields.md** - 迁移脚本说明
   - 路径: `backend/migrations/README_add_follow_up_fields.md`
   - 功能: 详细的使用说明和故障排除

## 数据查询逻辑

```typescript
// 查询参数映射
量来源 = "网络"  // 固定值

媒体来源 = {
  '新媒体': '新媒体平台',
  'SEM': '常规SEM平台'
}[选择的渠道]

校区 = 用户选择的校区
日期范围 = 选择年月的完整月份
```

## 媒体来源配置树

```
网络（量来源）
├── 新媒体平台（媒体来源）
│   ├── 抖音
│   ├── 快手
│   ├── 微信视频号
│   ├── 小红书
│   └── B站
├── 常规SEM平台（媒体来源）
│   ├── 百度推广
│   ├── 中心羊电
│   ├── 在线报名/网站留言
│   └── 百度爱番
└── 网络合作伙伴（媒体来源）
    ├── 百家网
    ├── 91搜客
    ├── 知了好学
    ├── 坦途网
    └── 厚学网
```

## 常见问题

### Q1: 运行迁移脚本时提示 "找不到模块"
**A**: 确保在 `backend` 目录下运行，并且已激活正确的Python环境

### Q2: 数据显示为空
**A**: 检查以下几点：
1. 咨询量录入系统中是否有数据
2. 量来源是否为"网络"
3. 媒体来源是否为"新媒体平台"或"常规SEM平台"
4. 选择的日期范围内是否有数据

### Q3: 仍然显示500错误
**A**: 
1. 确认数据库字段已添加成功
2. 重启后端服务
3. 清除浏览器缓存
4. 查看后端日志获取详细错误信息

## 验证成功标志

1. ✅ 迁移脚本执行成功，显示"迁移完成！"
2. ✅ 数据库中可以查询到新添加的字段
3. ✅ API请求返回200状态码
4. ✅ 前端页面能正常显示数据列表
5. ✅ 无控制台错误信息

## 后续维护

- 如需添加更多字段，参考 `add_follow_up_fields.py` 创建新的迁移脚本
- 保持ORM模型与数据库表结构一致
- 定期备份数据库
