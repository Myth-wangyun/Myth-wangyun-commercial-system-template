# 咨询量录入系统数据生成器更新说明

## 更新日期
2026-02-08

## 更新内容

### 功能改进
咨询量录入系统的数据生成器现在会从**配置中心的员工管理**部分获取网络专员信息，而不是使用硬编码的默认值。

### 具体修改

#### 1. 文件位置
`frontend/pages/consult/type-count-system/ConsultationGenerator.tsx`

#### 2. 主要变更

##### 2.1 导入配置中心API
```typescript
import { fetchEmployees } from '@/services/configMaster'
```

##### 2.2 添加网络专员配置状态
```typescript
// 网络专员配置（从配置中心员工管理获取）
const [networkStaffConfig, setNetworkStaffConfig] = useState<Record<string, string[]>>({})
const [loadingNetworkStaff, setLoadingNetworkStaff] = useState(false)
```

##### 2.3 加载网络专员数据
新增 `useEffect` 钩子，在组件加载时从配置中心获取网络专员：
- 调用 `fetchEmployees` API 获取所有在职员工
- 筛选职位为 **"网络客服"** 或 **"客服主管"** 的员工
- 按校区分组存储到 `networkStaffConfig` 状态中

##### 2.4 更新数据生成逻辑
修改 `generateConsultationRecord` 函数：
- 添加 `networkStaffConfig` 参数
- 当量来源为"网络"或"校区新媒体"时：
  - 优先从配置中心获取的网络专员列表中随机选择
  - 如果配置中心没有数据，则使用默认值作为后备

##### 2.5 UI 改进
- 加载状态提示：显示"加载网络专员列表..."
- 信息展示：成功加载后显示各校区的网络专员列表和人数
- 规则说明：在数据生成规则中添加网络专员分配说明

### 数据筛选规则

#### 员工筛选条件
- **职位**: "网络客服" 或 "客服主管"
- **状态**: 在职（is_active = true）
- **分组**: 按校区（campus_name）分组

#### 分配规则
- **触发条件**: 量来源为"网络"或"校区新媒体"
- **选择方式**: 从对应校区的网络专员列表中随机选择
- **后备方案**: 如果配置中心没有数据，使用默认值

### 数据库表结构

#### 配置中心员工表
```sql
-- config.employees
CREATE TABLE config.employees (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(user_id),
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,  -- 职位：网络客服、客服主管等
  contact VARCHAR(100) NOT NULL,
  campus_name VARCHAR(100) REFERENCES config.campuses(name),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### 咨询量明细表
```sql
-- consult.咨询量明细表_v2
-- 字段：网聊专员 VARCHAR(50)
-- 该字段存储从配置中心获取的网络专员姓名
```

### 使用流程

1. **配置员工信息**
   - 进入系统：配置中心 → 员工管理
   - 添加员工，设置职位为"网络客服"或"客服主管"
   - 分配对应的校区

2. **生成测试数据**
   - 进入：咨询 → 咨询量录入 → 数据生成器（仅开发模式）
   - 系统自动加载网络专员配置
   - 查看加载的网络专员列表
   - 选择校区、日期范围等参数
   - 点击"开始生成"

3. **数据验证**
   - 生成的咨询记录中，量来源为"网络"或"校区新媒体"的记录
   - 会自动分配对应校区的网络专员
   - 网聊专员字段会显示从配置中心获取的真实员工姓名

### 优势

1. **数据一致性**: 网络专员信息统一从配置中心管理，避免硬编码
2. **灵活性**: 可以随时在配置中心添加/修改网络专员，无需修改代码
3. **真实性**: 生成的测试数据更接近真实业务场景
4. **可维护性**: 员工信息集中管理，便于维护和更新

### 注意事项

1. **开发模式专用**: 数据生成器仅在开发环境（DEV）下可用
2. **权限要求**: 需要有访问配置中心员工管理的权限
3. **数据准备**: 使用前请确保配置中心已添加网络客服/客服主管员工
4. **后备机制**: 如果配置中心没有数据，系统会使用默认值，不会报错

### 相关文件

- **前端组件**: `frontend/pages/consult/type-count-system/ConsultationGenerator.tsx`
- **API服务**: `frontend/services/configMaster.ts`
- **数据模型**: `backend/app/models/config_master.py`
- **数据库表**: `config.employees`, `consult.咨询量明细表_v2`

### 测试建议

1. 在配置中心添加测试员工（职位：网络客服/客服主管）
2. 打开数据生成器，验证网络专员列表是否正确加载
3. 生成少量测试数据，检查网聊专员字段是否正确填充
4. 验证不同校区的数据是否分配了对应校区的网络专员

---

## 技术细节

### API调用
```typescript
// 获取员工列表
const employees = await fetchEmployees({
  is_active: true,
})

// 筛选和分组
employees.forEach(emp => {
  if (emp.position === '网络客服' || emp.position === '客服主管') {
    const campus = emp.campus_name || '未分配校区'
    if (!config[campus]) {
      config[campus] = []
    }
    config[campus].push(emp.name)
  }
})
```

### 数据生成逻辑
```typescript
// 网聊专员分配
if (sourceConfig.name === '网络' || sourceConfig.name === '校区新媒体') {
  const networkStaffList = networkStaffConfig[campus] || []
  if (networkStaffList.length > 0) {
    网聊专员 = randomPick(networkStaffList)
  } else {
    // 后备方案
    网聊专员 = randomPick(['网聊专员A', '网聊专员B', '网聊专员C'])
  }
}
```

---

**更新完成！** 🎉

