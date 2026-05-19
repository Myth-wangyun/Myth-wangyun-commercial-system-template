# 媒体来源筛选功能

## 功能概述

为网络投放效果汇总页面添加了媒体来源筛选功能，支持按照媒体来源进行数据筛选，与现有的校区筛选和月份筛选功能结合，提供更精确的数据分析能力。

## 功能特性

### 1. 后端API增强

#### 新增API接口
- **获取媒体来源列表**: `GET /api/v1/market/summary/media-source-list`
  - 从数据库中动态获取所有不重复的媒体来源
  - 如果没有数据，返回常见的媒体来源列表（百度、360、搜狗等）

#### 增强现有API
- **月度汇总API**: `GET /api/v1/market/summary/monthly`
  - 新增 `媒体来源` 查询参数
  - 支持与校区筛选的组合使用
  - 返回数据包含媒体来源筛选信息

### 2. 前端界面增强

#### 筛选器布局优化
- 调整筛选区域布局，为媒体来源筛选器腾出空间
- 校区筛选器：`col-md-2`
- 媒体来源筛选器：`col-md-2`
- 月份选择器：`col-md-4`
- 操作按钮：`col-md-4`

#### 新增UI组件
- **媒体来源下拉选择器**
  - 默认选项："===全部==="
  - 动态加载媒体来源列表
  - 支持实时筛选

- **重置筛选按钮**
  - 一键重置所有筛选条件
  - 恢复到当前月份
  - 重新加载数据

### 3. 功能逻辑

#### 筛选组合支持
- **单独筛选**: 仅按媒体来源筛选
- **组合筛选**: 校区 + 媒体来源 + 月份
- **全部显示**: 不选择任何筛选条件

#### 数据加载优化
- 异步加载媒体来源列表
- 筛选条件变化时自动重新加载数据
- 保持筛选状态，支持多次筛选

## 技术实现

### 后端实现

#### 数据库查询优化
```python
def 获取媒体来源列表(db: Session) -> List[str]:
    """从数据库中获取所有不重复的媒体来源"""
    sql = "SELECT DISTINCT 媒体来源 FROM 投放明细表 WHERE 媒体来源 IS NOT NULL ORDER BY 媒体来源"
    result = db.execute(text(sql)).fetchall()
    return [row[0] for row in result if row[0]]
```

#### API参数增强
```python
@router.get("/summary/monthly")
async def get_monthly_network_summary(
    年份: int = Query(..., description="年份"),
    月份: int = Query(..., description="月份"),
    校区: Optional[str] = Query(None, description="校区筛选"),
    媒体来源: Optional[str] = Query(None, description="媒体来源筛选"),  # 新增
    db: Session = Depends(get_market_db)
):
```

### 前端实现

#### JavaScript类增强
```javascript
class NetworkSummaryManager {
    constructor() {
        this.mediaSourceList = [];  // 新增媒体来源列表
        // ... 其他属性
    }
    
    async loadMediaSourceList() {
        // 加载媒体来源列表
    }
    
    resetFilters() {
        // 重置所有筛选条件
    }
}
```

#### 筛选参数构建
```javascript
const params = new URLSearchParams({
    年份: this.currentYear,
    月份: this.currentMonth
});

if (selectedCampus) {
    params.append('校区', selectedCampus);
}

if (selectedMediaSource) {  // 新增
    params.append('媒体来源', selectedMediaSource);
}
```

## 使用说明

### 1. 基本筛选
1. 打开网络投放效果汇总页面
2. 在"媒体来源"下拉框中选择要筛选的媒体来源
3. 点击"统计"按钮查看筛选结果

### 2. 组合筛选
1. 选择校区（可选）
2. 选择媒体来源（可选）
3. 选择月份
4. 点击"统计"按钮查看组合筛选结果

### 3. 重置筛选
1. 点击"重置筛选"按钮
2. 所有筛选条件将重置为默认值
3. 自动加载当前月份的全部数据

## 测试验证

### 测试页面
创建了专门的测试页面 `frontend/test-media-source-filter.html`，包含：
- API接口测试
- 筛选功能测试
- 功能说明文档

### 测试项目
1. **媒体来源列表API测试**
   - 验证API返回正确的媒体来源列表
   - 检查数据格式和内容

2. **月度汇总API测试**
   - 测试媒体来源筛选参数
   - 验证组合筛选功能
   - 检查返回数据完整性

3. **前端交互测试**
   - 筛选器选择功能
   - 数据加载和显示
   - 重置功能

## 兼容性说明

### 向后兼容
- 现有的校区筛选功能完全保留
- 月份筛选功能不受影响
- 原有的API调用方式仍然有效

### 数据兼容
- 支持现有的投放明细表结构
- 媒体来源字段为可选筛选条件
- 不影响现有数据的显示和统计

## 扩展性

### 未来增强
1. **多选筛选**: 支持同时选择多个媒体来源
2. **自定义筛选**: 支持自定义筛选条件组合
3. **筛选历史**: 保存常用的筛选条件组合
4. **导出功能**: 支持按筛选条件导出数据

### 性能优化
1. **缓存机制**: 缓存媒体来源列表，减少数据库查询
2. **分页加载**: 大量数据时支持分页显示
3. **异步加载**: 优化数据加载性能

## 总结

媒体来源筛选功能的添加，显著增强了网络投放效果汇总页面的数据分析能力。用户现在可以：

- 按媒体来源精确筛选投放数据
- 结合校区和月份进行多维度分析
- 快速重置筛选条件，提高操作效率
- 获得更精准的投放效果分析结果

该功能完全向后兼容，不影响现有功能的使用，为后续的功能扩展奠定了良好的基础。
