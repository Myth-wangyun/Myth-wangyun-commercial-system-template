# 压力面试成绩表数据获取问题修复

## 问题诊断

### 问题1: 前端过滤逻辑不完整
**位置**: `023-project-defense.tsx` 的 `filteredData`

**问题**: 前端只根据 `searchText` 和 `selectedClassCode` 过滤，没有根据 `selectedMajor`、`selectedCourse`、`instructor` 过滤。

**修复**: 已添加完整的过滤逻辑，包括专业、课程、教员的匹配。

### 问题2: 后端API缺少过滤参数
**位置**: `backend/app/api/v1/endpoints/press_interview_score.py` 和 `backend/app/crud/press_interview_score.py`

**问题**: 后端API只支持 `campus_name`、`class_name`、`search` 三个过滤参数，不支持专业、课程、教员、年份、月份过滤。

**修复**: 
- 后端API已添加 `major_name`、`course_name`、`instructor_name`、`year`、`month` 过滤参数
- CRUD函数已更新以支持这些过滤条件

### 问题3: 前端数据加载未传递所有过滤条件
**位置**: `023-project-defense.tsx` 的 `loadData` 函数

**问题**: 前端在调用API时只传递了 `campus` 和 `class_name`，没有传递 `selectedMajor`、`selectedCourse`、`instructor`。

**修复**: 已更新 `loadData` 函数，传递所有过滤条件到后端API。

### 问题4: 前端Service类型定义不完整
**位置**: `frontend/services/service.ts` 的 `pressInterviewScoreService.getList`

**问题**: Service函数的参数类型定义不包含新增的过滤参数。

**修复**: 已更新类型定义，添加 `major_name`、`course_name`、`instructor_name`、`year`、`month` 参数。

## 修复内容

### 后端修复

#### 1. API端点 (`backend/app/api/v1/endpoints/press_interview_score.py`)
```python
@router.get("/", response_model=PressInterviewScoreListResponse)
def list_press_scores(
    campus_name: str | None = Query(None),
    class_name: str | None = Query(None),
    major_name: str | None = Query(None),  # 新增
    course_name: str | None = Query(None),  # 新增
    instructor_name: str | None = Query(None),  # 新增
    year: int | None = Query(None),  # 新增
    month: int | None = Query(None),  # 新增
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
```

#### 2. CRUD函数 (`backend/app/crud/press_interview_score.py`)
```python
def list_scores(
    db: Session,
    campus_name: Optional[str] = None,
    class_name: Optional[str] = None,
    major_name: Optional[str] = None,  # 新增
    course_name: Optional[str] = None,  # 新增
    instructor_name: Optional[str] = None,  # 新增
    year: Optional[int] = None,  # 新增
    month: Optional[int] = None,  # 新增
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[PressInterviewScore], int]:
    query = db.query(PressInterviewScore)
    if campus_name:
        query = query.filter(PressInterviewScore.campus_name == campus_name)
    if class_name:
        query = query.filter(PressInterviewScore.class_name == class_name)
    if major_name:  # 新增
        query = query.filter(PressInterviewScore.major_name == major_name)
    if course_name:  # 新增
        query = query.filter(PressInterviewScore.course_name == course_name)
    if instructor_name:  # 新增
        query = query.filter(PressInterviewScore.instructor_name == instructor_name)
    if year is not None:  # 新增
        query = query.filter(PressInterviewScore.year == year)
    if month is not None:  # 新增
        query = query.filter(PressInterviewScore.month == month)
    # ... 其他过滤逻辑
```

### 前端修复

#### 1. Service函数 (`frontend/services/service.ts`)
```typescript
export const pressInterviewScoreService = {
  getList: async (
    params: ServiceQueryParams & {
      major_name?: string
      course_name?: string
      instructor_name?: string
      year?: number
      month?: number
    } = {},
    campus?: string,
    className?: string,
  ): Promise<ServicePageResponse<PressInterviewScore>> => {
    const res = await api.get('/press-interview-scores/', {
      params: {
        campus_name: campus,
        class_name: className,
        major_name: params.major_name,  // 新增
        course_name: params.course_name,  // 新增
        instructor_name: params.instructor_name,  // 新增
        year: params.year,  // 新增
        month: params.month,  // 新增
        search: params.search,
        page: params.page,
        page_size: params.pageSize,
      },
    })
    // ...
  }
}
```

#### 2. 数据加载函数 (`023-project-defense.tsx`)
```typescript
const loadData = async () => {
  setLoading(true);
  try {
    const res = await pressInterviewScoreService.getList(
      { 
        search: searchText,
        major_name: selectedMajor,  // 新增
        course_name: selectedCourse,  // 新增
        instructor_name: instructor,  // 新增
      },
      selectedCampus || currentCampus || undefined,
      selectedClassCode,
    );
    // ...
  }
};

useEffect(() => {
  loadData();
}, [selectedCampus, selectedClassCode, selectedMajor, selectedCourse, instructor, searchText]);  // 新增依赖
```

#### 3. 客户端过滤 (`023-project-defense.tsx`)
```typescript
const filteredData = dataSource.filter(item => {
  const matchesSearch = !searchText || 
    item.studentName.toLowerCase().includes(searchText.toLowerCase()) ||
    item.studentId.toLowerCase().includes(searchText.toLowerCase());
  
  const matchesClass = !selectedClassCode || item.classCode === selectedClassCode;
  const matchesMajor = !selectedMajor || item.majorName === selectedMajor;  // 新增
  const matchesCourse = !selectedCourse || item.courseName === selectedCourse;  // 新增
  const matchesInstructor = !instructor || item.instructor === instructor;  // 新增
  
  return matchesSearch && matchesClass && matchesMajor && matchesCourse && matchesInstructor;
});
```

## 测试数据匹配问题

### 问题分析

测试数据使用了以下值：
- **校区**: `盛邦校区`, `冀美校区`
- **专业**: `数字媒体`, `Java开发`, `UI设计`
- **班级**: `S32106`, `S32107`, `J202401`, `J202402`
- **课程**: `压力面试`, `综合面试`, `技术面试`
- **教员**: `杜鹏涛`, `李老师`, `王老师`, `张老师`

前端默认选择：
- **校区**: `盛邦校区` (从 store 获取)
- **专业**: `数字媒体`
- **班级**: `S32106`
- **课程**: `压力面试`
- **教员**: `杜鹏涛`

### 匹配情况

如果前端选择了：
- 校区: `盛邦校区`
- 专业: `数字媒体`
- 班级: `S32106`
- 课程: `压力面试`
- 教员: `杜鹏涛`

那么只有同时满足这些条件的数据才会显示。

### 解决方案

1. **后端过滤**: 现在后端API支持所有过滤条件，可以在数据库层面过滤
2. **前端过滤**: 作为补充，前端也会进行客户端过滤
3. **测试数据**: 确保测试数据覆盖各种组合，或者调整前端默认值以匹配测试数据

## 薪资预估表数据获取

薪资预估表在获取压力面试成绩时：
```typescript
pressInterviewScoreService.getList({ search: '' }, selectedCampus || currentCampus || '', selectedClassName)
```

**问题**: 只传递了校区和班级，没有传递专业、课程、教员等过滤条件。

**影响**: 如果数据库中有多个专业/课程/教员的压力面试成绩，可能会获取到不相关的数据。

**建议**: 薪资预估表应该根据实际需求，可能需要：
1. 获取所有相关数据（不限制专业/课程/教员）
2. 或者根据薪资预估表的配置，传递相应的过滤条件

## 验证步骤

1. **检查后端API**: 
   ```bash
   curl "http://localhost:8000/api/v1/press-interview-scores/?campus_name=盛邦校区&class_name=S32106&major_name=数字媒体&course_name=压力面试&instructor_name=杜鹏涛"
   ```

2. **检查前端数据加载**: 
   - 打开压力面试成绩表页面
   - 选择校区、专业、班级、课程、教员
   - 查看网络请求，确认所有过滤参数都正确传递

3. **检查数据展示**: 
   - 确认数据能正确显示
   - 确认过滤条件生效

4. **检查薪资预估表**: 
   - 打开薪资预估表页面
   - 确认压力面试成绩数据能正确获取和显示

## 注意事项

1. **数据匹配**: 确保测试数据的专业、课程、教员与前端默认选择匹配，或者调整前端默认值
2. **性能**: 添加了更多过滤条件，查询性能应该更好（数据量更小）
3. **兼容性**: 新增的过滤参数都是可选的，不会影响现有功能

