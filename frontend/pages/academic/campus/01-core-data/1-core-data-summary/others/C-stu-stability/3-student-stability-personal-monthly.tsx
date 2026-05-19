import React, { useEffect, useMemo, useState } from 'react'
import { App,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  AutoComplete,
  Space,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import CampusSelector from '@/components/common/CampusSelector'
import api from '@/services/api'
import { fetchTeachers, type TeacherProfile } from '@/services/configMaster'
import * as XLSX from 'xlsx'
import dayjs from 'dayjs'

const { Option } = Select
const { Title, Text } = Typography

interface MonthlyPersonalRecord {
  id: string
  month: number
  slot: number
  instructorName: string
  handoverCount: number
  enrollmentCount: number
  refundCount: number
}

interface MonthlyPersonalFormValues {
  month: number
  instructorName: string
  handoverCount: number
  enrollmentCount: number
  refundCount: number
}

type DisplayRow =
  | (MonthlyPersonalRecord & { rowType: 'data'; displayMonth: number | '' })
  | {
      id: string
      month: number
      instructorName: '合计'
      handoverCount: number
      enrollmentCount: number
      refundCount: number
      rowType: 'monthlyTotal'
      displayMonth: ''
    }
  | {
      id: 'grand-total'
      month: 0
      instructorName: '总计'
      handoverCount: number
      enrollmentCount: number
      refundCount: number
      rowType: 'grandTotal'
      displayMonth: '总计'
    }

const MONTH_COUNT = 12

const createDefaultRecords = (teacherNames: string[] = []): MonthlyPersonalRecord[] => {
  const records: MonthlyPersonalRecord[] = []
  const slotCount = teacherNames.length > 0 ? teacherNames.length : 1
  for (let month = 1; month <= MONTH_COUNT; month += 1) {
    for (let slot = 1; slot <= slotCount; slot += 1) {
      records.push({
        id: `month-${month}-slot-${slot}`,
        month,
        slot,
        instructorName: teacherNames[slot - 1] ?? '',
        handoverCount: 0,
        enrollmentCount: 0,
        refundCount: 0,
      })
    }
  }
  return records
}

const calcRate = (enrollment: number, refund: number): string =>
  enrollment > 0 ? `${((refund / enrollment) * 100).toFixed(1)}%` : ''

const buildFullRecords = (
  rawRows: any[] | undefined,
  teacherNames: string[],
): MonthlyPersonalRecord[] => {
  if (!rawRows || rawRows.length === 0) {
    return createDefaultRecords(teacherNames)
  }

  const converted = rawRows.map((row: any) => ({
    id: `month-${row.月份}-slot-${row.教员序号}`,
    month: Number(row.月份),
    slot: Number(row.教员序号),
    instructorName: row.教员姓名,
    handoverCount: row.交接人数 || 0,
    enrollmentCount: row.入学人数 || 0,
    refundCount: row.退费人数 || 0,
  }))

  const uniqueSlots = new Set<number>()
  converted.forEach((r: MonthlyPersonalRecord) => {
    if (r.slot >= 1) {
      uniqueSlots.add(r.slot)
    }
  })
  const maxSlotFromData = uniqueSlots.size > 0 ? Math.max(...Array.from(uniqueSlots)) : 0
  const slotCount = Math.max(maxSlotFromData, teacherNames.length || 1)

  const allRecords: MonthlyPersonalRecord[] = []
  for (let month = 1; month <= MONTH_COUNT; month += 1) {
    for (let slot = 1; slot <= slotCount; slot += 1) {
      const existing = converted.find((r) => r.month === month && r.slot === slot)
      if (existing) {
        allRecords.push(existing)
      } else {
        allRecords.push({
          id: `month-${month}-slot-${slot}`,
          month,
          slot,
          instructorName: teacherNames[slot - 1] ?? '',
          handoverCount: 0,
          enrollmentCount: 0,
          refundCount: 0,
        })
      }
    }
  }
  return allRecords
}

const StudentStabilityPersonalMonthlyPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore()
  const activeCampus = currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿'
  const [year, setYear] = useState<number>(dayjs().year())

  // 生成年份选项
  const currentYear = dayjs().year();
  const yearOptions = Array.from({ length: 10 }, (_, i) => ({
    value: currentYear - 5 + i,
    label: `${currentYear - 5 + i}年`,
  }));

  const [records, setRecords] = useState<MonthlyPersonalRecord[]>(() => createDefaultRecords())
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MonthlyPersonalRecord | null>(null)
  const [form] = Form.useForm<MonthlyPersonalFormValues>()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [teacherNames, setTeacherNames] = useState<string[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(true)

  // 从配置中心获取教员列表
  useEffect(() => {
    let cancelled = false

    const loadTeachers = async () => {
      setLoadingTeachers(true)
      try {
        const teachers = await fetchTeachers({
          campus_name: activeCampus,
          active: true,
          participate_kpi: true,
        })
        if (cancelled) return

        const names = teachers
          .filter((t: TeacherProfile) => t.is_active && t.participate_kpi)
          .map((t) => t.name)
          .filter(Boolean)
          .sort()
        setTeacherNames(names)
      } catch (error) {
        console.error('获取教员列表失败:', error)
        if (!cancelled) {
          setTeacherNames([])
          message.error('获取教员列表失败，请稍后重试')
        }
      } finally {
        if (!cancelled) {
          setLoadingTeachers(false)
        }
      }
    }
    loadTeachers()
    return () => {
      cancelled = true
    }
  }, [activeCampus])

  // 从后端加载数据
  useEffect(() => {
    if (loadingTeachers) return

    const loadData = async (autoSave: boolean = false) => {
      setLoading(true)
      try {
        const res = await api.get('/student-stability-personal-monthly', {
          params: { campus: activeCampus, year: year },
        })
        const data = res.data
        let finalRecords: MonthlyPersonalRecord[]
        if (data?.行列表 && data.行列表.length > 0) {
          finalRecords = buildFullRecords(data.行列表, teacherNames)
        } else {
          finalRecords = createDefaultRecords(teacherNames)
        }
        setRecords(finalRecords)
        
        // 如果需要自动保存，则保存到后端
        if (autoSave && data?.行列表 && data.行列表.length > 0) {
          try {
            const validRecords = finalRecords.filter(
              (r) => r.instructorName.trim() && (r.handoverCount > 0 || r.enrollmentCount > 0 || r.refundCount > 0)
            )
            if (validRecords.length > 0) {
              const payload = {
                神殿名称: activeCampus,
                年份: year,
                行列表: validRecords.map((r) => ({
                  月份: Number(r.month),
                  教员序号: Number(r.slot),
                  教员姓名: r.instructorName.trim(),
                  交接人数: Number(r.handoverCount) || 0,
                  入学人数: Number(r.enrollmentCount) || 0,
                  退费人数: Number(r.refundCount) || 0,
                })),
              }
              await api.post('/student-stability-personal-monthly', payload)
            }
          } catch (saveError: any) {
            console.error('自动保存失败', saveError)
            // 静默失败，不显示错误提示
          }
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        setRecords(createDefaultRecords(teacherNames))
      } finally {
        setLoading(false)
      }
    }
    // 等待教员列表加载完成后再加载数据
    if (!loadingTeachers) {
      loadData(true) // 初次加载时自动保存
    }
  }, [activeCampus, year, teacherNames, loadingTeachers])

  const displayRows: DisplayRow[] = useMemo(() => {
    const rows: DisplayRow[] = []
    for (let month = 1; month <= MONTH_COUNT; month += 1) {
      const monthItems = records
        .filter((item) => item.month === month)
        .sort((a, b) => a.slot - b.slot)
        .map((item, index) => ({
          ...item,
          rowType: 'data' as const,
          displayMonth: (index === 0 ? month : '') as number | '',
        }))
      const monthTotals = monthItems.reduce(
        (acc, item) => ({
          handover: acc.handover + item.handoverCount,
          enrollment: acc.enrollment + item.enrollmentCount,
          refund: acc.refund + item.refundCount,
        }),
        { handover: 0, enrollment: 0, refund: 0 },
      )
      rows.push(...monthItems)
      rows.push({
        id: `month-${month}-total`,
        month,
        instructorName: '合计',
        handoverCount: monthTotals.handover,
        enrollmentCount: monthTotals.enrollment,
        refundCount: monthTotals.refund,
        rowType: 'monthlyTotal',
        displayMonth: '',
      })
    }
    const grandTotals = records.reduce(
      (acc, item) => ({
        handover: acc.handover + item.handoverCount,
        enrollment: acc.enrollment + item.enrollmentCount,
        refund: acc.refund + item.refundCount,
      }),
      { handover: 0, enrollment: 0, refund: 0 },
    )
    rows.push({
      id: 'grand-total',
      month: 0,
      instructorName: '总计',
      handoverCount: grandTotals.handover,
      enrollmentCount: grandTotals.enrollment,
      refundCount: grandTotals.refund,
      rowType: 'grandTotal',
      displayMonth: '总计',
    })
    return rows
  }, [records])

  const columns: ColumnsType<DisplayRow> = [
    {
      title: '月份',
      dataIndex: 'displayMonth',
      key: 'month',
      width: 90,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'monthlyTotal') {
          return ''
        }
        if (record.rowType === 'grandTotal') {
          return <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{value}</span>
        }
        return value || ''
      },
    },
    {
      title: '教员姓名',
      dataIndex: 'instructorName',
      key: 'instructorName',
      width: 160,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'monthlyTotal') {
          return <span style={{ color: '#ff4d4f', fontWeight: 600 }}>合计</span>
        }
        if (record.rowType === 'grandTotal') {
          return ''
        }
        return value || ''
      },
    },
    {
      title: '交接人数',
      dataIndex: 'handoverCount',
      key: 'handoverCount',
      width: 140,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'data') {
          return value > 0 ? value : ''
        }
        return <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{value}</span>
      },
    },
    {
      title: '入学人数',
      dataIndex: 'enrollmentCount',
      key: 'enrollmentCount',
      width: 140,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'data') {
          return value > 0 ? value : ''
        }
        return <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{value}</span>
      },
    },
    {
      title: '退费人数',
      dataIndex: 'refundCount',
      key: 'refundCount',
      width: 140,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'data') {
          return value > 0 ? value : ''
        }
        return <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{value}</span>
      },
    },
    {
      title: '退费率',
      key: 'refundRate',
      width: 140,
      align: 'center',
      render: (_, record) => {
        if (record.rowType === 'data') {
          return calcRate(record.enrollmentCount, record.refundCount)
        }
        return (
          <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
            {calcRate(record.enrollmentCount, record.refundCount)}
          </span>
        )
      },
    },
  ]

  const openModal = (record?: MonthlyPersonalRecord) => {
    setEditingRecord(record ?? null)
    form.resetFields()
    form.setFieldsValue({
      month: record?.month ?? undefined,
      instructorName: record?.instructorName ?? '',
      handoverCount: record?.handoverCount ?? 0,
      enrollmentCount: record?.enrollmentCount ?? 0,
      refundCount: record?.refundCount ?? 0,
    })
    setModalVisible(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      // 验证表单数据
      if (!values.instructorName || values.instructorName.trim() === '') {
        message.error('教员姓名不能为空')
        return
      }
      if (values.month < 1 || values.month > 12) {
        message.error('月份必须在1-12之间')
        return
      }
      const updatedRecords = [...records]
      const existingIndex = updatedRecords.findIndex(
        (item) => item.month === values.month && item.instructorName === values.instructorName.trim(),
      )

      // 不再在编辑表单中填写“教员序号”，这里按教员姓名在当月的排序生成一个稳定的 slot
      const monthNames = Array.from(
        new Set(
          updatedRecords
            .filter((r) => r.month === values.month)
            .map((r) => r.instructorName)
            .concat(values.instructorName.trim()),
        ),
      )
        .filter(Boolean)
        .sort()
      const slot = Math.max(1, monthNames.indexOf(values.instructorName.trim()) + 1)

      const normalized: MonthlyPersonalRecord = {
        id: `month-${values.month}-slot-${slot}`,
        month: values.month,
        slot,
        instructorName: values.instructorName.trim(),
        handoverCount: Number(values.handoverCount) || 0,
        enrollmentCount: Number(values.enrollmentCount) || 0,
        refundCount: Number(values.refundCount) || 0,
      }

      if (existingIndex >= 0) {
        // 保留原来的 slot（如果存在）以尽量避免行位置跳动
        const keepSlot = updatedRecords[existingIndex].slot || slot
        updatedRecords[existingIndex] = {
          ...updatedRecords[existingIndex],
          ...normalized,
          slot: keepSlot,
          id: `month-${values.month}-slot-${keepSlot}`,
        }
      } else {
        updatedRecords.push(normalized)
      }
      setRecords(updatedRecords)
      // 保存到后端
      setSaving(true)
      try {
        // 过滤和验证数据：只保留有效的记录（月份合法，教员姓名不能为空）
        const validRecords = updatedRecords.filter((r) => {
          const isValid = 
            r.slot >= 1 && 
            r.month >= 1 && r.month <= 12 &&
            r.instructorName && r.instructorName.trim() !== ''
          if (!isValid) {
            console.warn('跳过无效记录:', r)
          }
          return isValid
        })
        
        console.log('验证后的有效记录数量:', validRecords.length, '总记录数:', updatedRecords.length)
        
        if (validRecords.length === 0) {
          message.error('没有有效的数据可保存，请确保月份在1-12之间，且教员姓名不为空')
          setSaving(false)
          return
        }
        
        const payload = {
          神殿名称: activeCampus,
          年份: year,
          行列表: validRecords.map((r) => ({
            月份: Number(r.month),
            教员序号: Number(r.slot),
            教员姓名: r.instructorName.trim(),
            交接人数: Number(r.handoverCount) || 0,
            入学人数: Number(r.enrollmentCount) || 0,
            退费人数: Number(r.refundCount) || 0,
          })),
        }
        
        console.log('准备保存数据:', {
          神殿名称: payload.神殿名称,
          年份: payload.年份,
          记录数: payload.行列表.length,
          前3条记录: payload.行列表.slice(0, 3),
        })

        const res = await api.post('/student-stability-personal-monthly', payload)
        const responseData = res.data
        console.log('保存成功，服务器返回:', {
          神殿名称: responseData.神殿名称,
          年份: responseData.年份,
          保存的记录数: responseData.总数,
        })
        message.success(`保存成功，共保存 ${responseData.总数 || validRecords.length} 条记录`)
        
        // 重新加载数据以确保同步
        const reloadRes = await api.get('/student-stability-personal-monthly', {
          params: { campus: activeCampus, year: year },
        })
        if (reloadRes.status >= 200 && reloadRes.status < 300) {
          const reloadData = reloadRes.data
          if (reloadData?.行列表 && reloadData.行列表.length > 0) {
            setRecords(buildFullRecords(reloadData.行列表, teacherNames))
          } else {
            setRecords(createDefaultRecords(teacherNames))
          }
        }
      } catch (error: any) {
        console.error('保存失败:', error)
        const detail =
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          error?.message ||
          '请稍后重试'
        message.error(`保存失败: ${detail}`)
      } finally {
        setSaving(false)
      }
      
      setModalVisible(false)
      setEditingRecord(null)
    } catch {
      // ignore validation errors
    }
  }

  // 保存所有数据到服务器
  const handleSaveAll = async () => {
    setSaving(true)
    try {
      // 过滤和验证数据：只保留有效的记录（教员序号必须是1或2，教员姓名不能为空）
      const validRecords = records.filter((r) => {
        const isValid = 
          r.slot >= 1 && 
          r.month >= 1 && r.month <= 12 &&
          r.instructorName && r.instructorName.trim() !== ''
        if (!isValid) {
          console.warn('跳过无效记录:', r)
        }
        return isValid
      })
      
      console.log('验证后的有效记录数量:', validRecords.length, '总记录数:', records.length)
      
      if (validRecords.length === 0) {
        message.error('没有有效的数据可保存，请确保教员序号为1或2，且教员姓名不为空')
        setSaving(false)
        return
      }
      
      const payload = {
        神殿名称: activeCampus,
        年份: currentYear,
        行列表: validRecords.map((r) => ({
          月份: Number(r.month),
          教员序号: Number(r.slot),
          教员姓名: r.instructorName.trim(),
          交接人数: Number(r.handoverCount) || 0,
          入学人数: Number(r.enrollmentCount) || 0,
          退费人数: Number(r.refundCount) || 0,
        })),
      }
      
      console.log('准备保存所有数据:', {
          神殿名称: payload.神殿名称,
          年份: payload.年份,
          记录数: payload.行列表.length,
          前3条记录: payload.行列表.slice(0, 3),
        })

      const res = await api.post('/student-stability-personal-monthly', payload)
      
      const responseData = res.data
      console.log('保存成功，服务器返回:', {
        神殿名称: responseData.神殿名称,
        年份: responseData.年份,
        保存的记录数: responseData.总数,
      })
      message.success(`所有数据已保存到服务器，共保存 ${responseData.总数 || validRecords.length} 条记录`)
      
      // 重新加载数据以确保同步
      const reloadRes = await api.get('/student-stability-personal-monthly', {
        params: { campus: activeCampus, year: currentYear },
      })
      if (reloadRes.status >= 200 && reloadRes.status < 300) {
        const reloadData = reloadRes.data
        if (reloadData?.行列表 && reloadData.行列表.length > 0) {
          setRecords(buildFullRecords(reloadData.行列表, teacherNames))
        } else {
          setRecords(createDefaultRecords(teacherNames))
        }
      }
    } catch (error: any) {
      console.error('保存失败:', error)
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        '请稍后重试'
      message.error(`保存失败: ${detail}`)
    } finally {
      setSaving(false)
    }
  }

  // Excel导入功能
  const handleImportExcel = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setLoading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

            if (jsonData.length < 2) {
              message.error('Excel文件内容为空或格式不正确');
              return;
            }

            // 查找表头行
            const headers = jsonData[0] || [];
            const headerMap: Record<string, number> = {};
            
            headers.forEach((header: any, index: number) => {
              const headerStr = String(header || '').trim();
              if (headerStr.includes('月份') || headerStr.includes('月')) {
                headerMap['month'] = index;
              } else if (headerStr.includes('教员姓名') || headerStr.includes('姓名')) {
                headerMap['name'] = index;
              } else if (headerStr.includes('交接人数') || headerStr.includes('交接')) {
                headerMap['handover'] = index;
              } else if (headerStr.includes('入学人数') || headerStr.includes('入学')) {
                headerMap['enrollment'] = index;
              } else if (headerStr.includes('退费人数') || headerStr.includes('退费')) {
                headerMap['refund'] = index;
              }
            });

            if (!headerMap['month'] || !headerMap['name']) {
              message.error('无法识别Excel表头，请确保包含"月份"和"教员姓名"列');
              return;
            }

            // 解析数据行
            const importedRecords: MonthlyPersonalRecord[] = [];
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.every((cell: any) => !cell)) continue; // 跳过空行

              const month = Number(row[headerMap['month']]) || 0;
              if (month < 1 || month > 12) continue; // 跳过无效月份

              const name = String(row[headerMap['name']] || '').trim();
              if (!name || name === '合计' || name === '总计') continue; // 跳过合计行

              const handover = headerMap['handover'] !== undefined 
                ? Number(row[headerMap['handover']]) || 0 
                : 0;
              const enrollment = headerMap['enrollment'] !== undefined 
                ? Number(row[headerMap['enrollment']]) || 0 
                : 0;
              const refund = headerMap['refund'] !== undefined 
                ? Number(row[headerMap['refund']]) || 0 
                : 0;

              // 确定slot（教员序号）
              const monthNames = Array.from(
                new Set(
                  importedRecords
                    .filter((r) => r.month === month)
                    .map((r) => r.instructorName)
                    .concat(name),
                ),
              )
                .filter(Boolean)
                .sort();
              const slot = Math.max(1, monthNames.indexOf(name) + 1);

              importedRecords.push({
                id: `month-${month}-slot-${slot}`,
                month,
                slot,
                instructorName: name,
                handoverCount: handover,
                enrollmentCount: enrollment,
                refundCount: refund,
              });
            }

            if (importedRecords.length === 0) {
              message.error('未能从Excel中解析出有效数据');
              return;
            }

            // 合并到现有数据
            const updatedRecords = [...records];
            importedRecords.forEach((newRecord) => {
              const existingIndex = updatedRecords.findIndex(
                (r) => r.month === newRecord.month && r.instructorName === newRecord.instructorName,
              );
              if (existingIndex >= 0) {
                updatedRecords[existingIndex] = newRecord;
              } else {
                updatedRecords.push(newRecord);
              }
            });

            setRecords(updatedRecords);
            message.success(`成功导入 ${importedRecords.length} 条数据`);
          } catch (error) {
            console.error('Excel解析失败:', error);
            message.error('Excel文件解析失败，请检查文件格式');
          } finally {
            setLoading(false);
          }
        };
        reader.onerror = () => {
          message.error('文件读取失败');
          setLoading(false);
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('导入失败:', error);
        message.error('导入失败，请稍后重试');
        setLoading(false);
      }
    };
    input.click();
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            后端新生维稳个人汇总表
          </Title>
          <Space>
            <Select
              value={year}
              onChange={setYear}
              options={yearOptions}
              style={{ width: 120 }}
            />
            <CampusSelector useGlobalState={true} />
          </Space>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Button onClick={async () => {
            if (!loadingTeachers) {
              setLoading(true)
              try {
                const res = await api.get('/student-stability-personal-monthly', {
                  params: { campus: activeCampus, year: year },
                })
                const data = res.data
                if (data?.行列表 && data.行列表.length > 0) {
                  const updatedRecords = buildFullRecords(data.行列表, teacherNames)
                  setRecords(updatedRecords)
                  // 自动保存
                  const validRecords = updatedRecords.filter(
                    (r) => r.instructorName.trim() && (r.handoverCount > 0 || r.enrollmentCount > 0 || r.refundCount > 0)
                  )
                  if (validRecords.length > 0) {
                    const payload = {
                      神殿名称: activeCampus,
                      年份: year,
                      行列表: validRecords.map((r) => ({
                        月份: Number(r.month),
                        教员序号: Number(r.slot),
                        教员姓名: r.instructorName.trim(),
                        交接人数: Number(r.handoverCount) || 0,
                        入学人数: Number(r.enrollmentCount) || 0,
                        退费人数: Number(r.refundCount) || 0,
                      })),
                    }
                    await api.post('/student-stability-personal-monthly', payload)
                  }
                }
              } catch (error: any) {
                console.error('刷新失败', error)
                message.error('刷新失败，请稍后重试')
              } finally {
                setLoading(false)
              }
            }
          }} loading={loading}>
            刷新
          </Button>
        </div>

        <Table<DisplayRow>
          bordered
          size="small"
          columns={columns}
          dataSource={displayRows}
          rowKey="id"
          pagination={false}
          loading={loading}
          sticky
          scroll={{ x: 'max-content', y: 600 }}
        />
      </Card>

      <Modal
        title={
          editingRecord ? `编辑 ${editingRecord.month} 月数据` : '填写教员月度数据'
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingRecord(null)
          form.resetFields()
        }}
        onOk={handleSave}
        destroyOnClose
        width={540}
      >
        <Form<MonthlyPersonalFormValues> form={form} layout="vertical">
          <Form.Item label="月份" name="month" rules={[{ required: true, message: '请选择月份' }]}>
            <Select placeholder="请选择月份">
              {Array.from({ length: MONTH_COUNT }, (_, index) => (
                <Option key={index + 1} value={index + 1}>
                  {index + 1}月
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="教员姓名"
            name="instructorName"
            rules={[{ required: true, message: '请选择或输入教员姓名' }]}
            tooltip="可以从列表选择已有教员，也可以输入新教员姓名"
          >
            <AutoComplete
              placeholder="请选择或输入教员姓名"
              options={teacherNames.map((name) => ({ value: name }))}
              filterOption={(inputValue, option) =>
                option?.value?.toLowerCase().includes(inputValue.toLowerCase()) ?? false
              }
              allowClear
              onSelect={(value) => {
                // 如果选择的是新值且不在列表中，自动添加到列表
                if (value && !teacherNames.includes(value)) {
                  setTeacherNames((prev) => [...prev, value].sort())
                }
              }}
              onBlur={(e) => {
                const value = (e.target as HTMLInputElement)?.value?.trim()
                // 如果输入的是新值且不在列表中，自动添加到列表
                if (value && !teacherNames.includes(value)) {
                  setTeacherNames((prev) => [...prev, value].sort())
                }
              }}
            />
          </Form.Item>
          <Form.Item
            label="交接人数"
            name="handoverCount"
            rules={[{ required: true, message: '请输入交接人数' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="入学人数"
            name="enrollmentCount"
            rules={[{ required: true, message: '请输入入学人数' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="退费人数"
            name="refundCount"
            rules={[{ required: true, message: '请输入退费人数' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default StudentStabilityPersonalMonthlyPage
