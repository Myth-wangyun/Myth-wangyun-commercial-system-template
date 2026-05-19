# 剩余3个文件修改指南

需要修改的文件：
1. `5-campus-long-absence-detail.tsx` (长期不上课明细) - status="长期不上课", endpoint="/teaching-quality/campus-long-absence-detail", rowType=LongAbsenceDetailRow
2. `6-campus-vacation-students-detail.tsx` (寒暑假学生明细) - status="寒暑假", endpoint="/teaching-quality/campus-vacation-students-detail", rowType=VacationStudentsDetailRow  
3. `7-campus-other-situation-detail.tsx` (其他情况明细) - status="其他", endpoint="/teaching-quality/campus-other-situation-detail", rowType=OtherSituationDetailRow

## 已完成的文件（可作为参考）：
- ✅ 2-campus-refund-detail.tsx (退费明细)
- ✅ 3-campus-suspension-detail.tsx (休学明细)
- ✅ 4-campus-long-leave-detail.tsx (长期请假明细)

## 修改模式（对每个文件应用以下改动）：

### 1. 修改 `fetchFromServer` 函数
```typescript
const fetchFromServer = async (): Promise<[RowType][]> => {
  if (!canIO) {
    message.warning('请先选择校区/年份')
    return []
  }
  try {
    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    const urls = months.map((m) => buildApiUrl(`[endpoint]?campus=${encodeURIComponent(currentCampus!)}&year=${year}&month=${m}`))
    const resList = await Promise.all(urls.map((u) => fetch(u).catch(() => null)))
    const allRows: [RowType][] = []
    for (let i = 0; i < resList.length; i++) {
      const r = resList[i]
      if (r && r.ok) {
        const data = await r.json()
        const list = (data?.行列表 || []) as any[]
        list.forEach((item: any, idx: number) => allRows.push({ ...mapRow(item, idx, i + 1), _source: 'server' }))
      }
    }
    return allRows
  } catch (e) {
    console.error(e)
    message.error('从服务器加载失败')
    return []
  }
}
```

### 2. 修改 `importFromClassFile` 函数
```typescript
const importFromClassFile = async (): Promise<[RowType][]> => {
  if (!currentCampus) {
    message.warning('请先选择校区')
    return []
  }
  
  try {
    const res = await fetch(
      buildApiUrl(`/teaching-quality/class-file/students-by-status?campus=${encodeURIComponent(currentCampus)}&status=[status]`)
    )
    if (!res.ok) throw new Error('获取学生失败')
    const students: any[] = await res.json()
    
    if (students.length === 0) {
      return []
    }
    
    const importedRows: [RowType][] = students.map((student, idx) => ({
      key: `import-${Date.now()}-${idx}`,
      serialNumber: idx + 1,
      _source: 'classFile',
      // ... 其他字段映射
    }))
    
    return importedRows
  } catch (error) {
    console.error('导入失败:', error)
    message.error('从班档案表导入失败')
    return []
  }
}
```

### 3. 添加 `mergeData` 函数（在useEffect之前）
```typescript
const mergeData = (serverData: [RowType][], classFileData: [RowType][]): [RowType][] => {
  const idCardMap = new Map<string, [RowType]>()
  
  serverData.forEach(row => {
    if (row.idCard && row.idCard.trim()) {
      idCardMap.set(row.idCard.trim(), row)
    }
  })
  
  classFileData.forEach(row => {
    const idCard = row.idCard?.trim()
    if (idCard && !idCardMap.has(idCard)) {
      idCardMap.set(idCard, row)
    }
  })
  
  const merged = Array.from(idCardMap.values())
  return merged.map((r, i) => ({ ...r, serialNumber: i + 1 }))
}
```

### 4. 修改 `useEffect`
```typescript
useEffect(() => {
  if (currentCampus) {
    setRows(createInitialRows()) // or setRows([])
    setForceVisibleKeys(new Set())
    Promise.all([fetchFromServer(), importFromClassFile()]).then(([serverData, classFileData]) => {
      const merged = mergeData(serverData, classFileData)
      setRows(merged)
      message.success(`已加载 ${merged.length} 条记录（服务器：${serverData.length}，班档案表：${classFileData.length}）`)
    })
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentCampus])
```

### 5. 修改 `displayRows`
```typescript
const displayRows = useMemo(() => {
  let filtered = rows.filter(r => forceVisibleKeys.has(r.key) || hasRowData(r))
  if (month !== 0) {
    filtered = filtered.filter(r => r._month === month)
  }
  return filtered
}, [rows, forceVisibleKeys, month])
```

### 6. 修改 `saveToServer` 中的刷新逻辑
```typescript
// 在保存成功后
message.success('保存成功')
const [serverData, classFileData] = await Promise.all([fetchFromServer(), importFromClassFile()])
const merged = mergeData(serverData, classFileData)
setRows(merged)
```

### 7. 修改刷新和导入按钮
```typescript
<Button onClick={async () => {
  const [serverData, classFileData] = await Promise.all([fetchFromServer(), importFromClassFile()])
  const merged = mergeData(serverData, classFileData)
  setRows(merged)
  message.success(`已刷新 ${merged.length} 条记录`)
}} disabled={!canIO}>刷新</Button>

<Button onClick={async () => {
  const data = await importFromClassFile()
  message.success(`从班档案表获取到 ${data.length} 条记录`)
}} disabled={!currentCampus}>从班档案表导入</Button>
```

## 关键要点：
- 删除 `if (month === 0) ... else ...` 的判断逻辑
- 删除 message.info('没有找到状态为"xxx"的学生') 和 message.success('已导入...') 提示
- 函数返回 Promise<RowType[]> 而不是 void
- 添加 _source 标记：'server' 或 'classFile'
- useEffect只依赖 [currentCampus]，不依赖 year 和 month
- displayRows 添加 month 到依赖数组
