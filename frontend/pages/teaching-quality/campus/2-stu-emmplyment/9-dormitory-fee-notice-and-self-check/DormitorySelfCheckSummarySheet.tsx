// 宿舍管理-（1月）自查统计 · DormitorySelfCheckSummarySheet

import React, { useEffect, useState } from 'react'
import { App, Card, Table, Input, Select, Button, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'
import { DeleteOutlined } from '@ant-design/icons'

const { Option } = Select

interface DormitorySelfCheckRow {
  key: string
  manager: string
  serialNumber: number
  dormitoryName: string
  residentsCount: string
  hasComplaintOrAccident: string
  dailyCheck: string
  feeCollectedOnTime: string
  weeklyMeeting: string
  weeklySanitationCheck: string
  issuesResolvedTimely: string
  discipline: string
  remark: string
}

const YES_NO_OPTIONS = ['是', '否']

const createRow = (serial: number, manager: string = ''): DormitorySelfCheckRow => ({
  key: `${manager}-${serial}-${Date.now()}`,
  manager,
  serialNumber: serial,
  dormitoryName: '',
  residentsCount: '',
  hasComplaintOrAccident: '',
  dailyCheck: '',
  feeCollectedOnTime: '',
  weeklyMeeting: '',
  weeklySanitationCheck: '',
  issuesResolvedTimely: '',
  discipline: '',
  remark: '',
})

const initialData: DormitorySelfCheckRow[] = [
  createRow(1),
  createRow(2),
  createRow(3),
  createRow(4),
]

const DormitorySelfCheckSummarySheet: React.FC = () => {
  const { message } = App.useApp()
  const [dormitoryOptions, setDormitoryOptions] = useState<{ label: string; value: string; manager: string }[]>([]);
  const [dormOccupancy, setDormOccupancy] = useState<Record<string, number>>({});
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dataSource, setDataSource] = useState<DormitorySelfCheckRow[]>(initialData)

  const handleChange = (key: string, field: keyof DormitorySelfCheckRow, value: string) => {
    // 当宿舍名称变化时，自动填充对应的管理老师
    if (field === 'dormitoryName') {
      const selectedDorm = dormitoryOptions.find(opt => opt.value === value)
      if (selectedDorm) {
        const occupancy = dormOccupancy[value] ?? '';
        setDataSource(prev =>
          prev.map(row =>
            row.key === key
              ? { ...row, dormitoryName: value, manager: selectedDorm.manager || '', residentsCount: String(occupancy) }
              : row
          )
        );
        return;
      }
    }
    setDataSource((prev) => {
      if (field === 'manager') {
        const next = [...prev]
        const idx = next.findIndex((r) => r.key === key)
        if (idx === -1) return prev
        const oldName = (next[idx].manager || '').trim()
        // 找到与当前行相邻的同名连续区间，仅更新该区间
        let start = idx
        while (start - 1 >= 0 && (next[start - 1].manager || '').trim() === oldName) start--
        let end = idx
        while (end + 1 < next.length && (next[end + 1].manager || '').trim() === oldName) end++
        for (let i = start; i <= end; i++) {
          next[i] = { ...next[i], manager: value }
        }
        // 变更后重新按出现顺序为每位管理老师编号
        const counters = new Map<string, number>()
        return next.map((r) => {
          const k = (r.manager || '').trim()
          const n = (counters.get(k) || 0) + 1
          counters.set(k, n)
          return { ...r, serialNumber: n }
        })
      }
      // 非管理老师字段，按原逻辑更新
      return prev.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    })
  }

  const renderYesNoSelect = (
    text: string,
    record: DormitorySelfCheckRow,
    field: keyof DormitorySelfCheckRow,
  ) => (
    <Select
      allowClear
      value={text || undefined}
      style={{ width: '100%' }}
      onChange={(v) => handleChange(record.key, field, v === undefined ? '' : v)}
    >
      {YES_NO_OPTIONS.map((option) => (
        <Option key={option} value={option}>
          {option}
        </Option>
      ))}
    </Select>
  )

  // 管理老师列合并：相邻且相同的值合并
  const getManagerRowSpan = (record: DormitorySelfCheckRow, index: number) => {
    const cur = (record.manager || '').trim()
    if (index > 0 && ((dataSource[index - 1].manager || '').trim()) === cur) return 0
    let count = 1
    for (let i = index + 1; i < dataSource.length; i++) {
      if (((dataSource[i].manager || '').trim()) === cur) count++
      else break
    }
    return count
  }

  // 删除行
  const deleteRow = (key: string) => {
    setDataSource((prev) => {
      const filtered = prev.filter((r) => r.key !== key)
      // 保持原有行顺序，按管理老师分别重新编号
      const counters = new Map<string, number>()
      return filtered.map((r) => {
        const k = r.manager || ''
        const n = (counters.get(k) || 0) + 1
        counters.set(k, n)
        return { ...r, serialNumber: n }
      })
    })
  }

  const columns: ColumnsType<DormitorySelfCheckRow> = [
    {
      title: '管理老师',
      dataIndex: 'manager',
      key: 'manager',
      width: 100,
      fixed: 'left',
      align: 'center',
      render: (text, record, index) => ({
        children: <span>{text}</span>,
        props: { rowSpan: getManagerRowSpan(record, index) },
      }),
    },
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center',
    },
    {
      title: '宿舍名称',
      dataIndex: 'dormitoryName',
      key: 'dormitoryName',
      width: 140,
      align: 'center',
      render: (text) => <span>{text}</span>,
    },
    {
      title: '住宿人数',
      dataIndex: 'residentsCount',
      key: 'residentsCount',
      width: 100,
      align: 'center',
      render: (text, record) => (
        <Input
          value={text}
          onChange={(e) => handleChange(record.key, 'residentsCount', e.target.value)}
        />
      ),
    },
    {
      title: '是否有投诉或重大事故',
      dataIndex: 'hasComplaintOrAccident',
      key: 'hasComplaintOrAccident',
      width: 180,
      align: 'center',
      render: (text, record) => renderYesNoSelect(text, record, 'hasComplaintOrAccident'),
    },
    {
      title: '是否每日正常查寝',
      dataIndex: 'dailyCheck',
      key: 'dailyCheck',
      width: 150,
      align: 'center',
      render: (text, record) => renderYesNoSelect(text, record, 'dailyCheck'),
    },
    {
      title: '是否按时都已收取住宿费，收支正常',
      dataIndex: 'feeCollectedOnTime',
      key: 'feeCollectedOnTime',
      width: 220,
      align: 'center',
      render: (text, record) => renderYesNoSelect(text, record, 'feeCollectedOnTime'),
    },
    {
      title: '是否每周开宿舍会',
      dataIndex: 'weeklyMeeting',
      key: 'weeklyMeeting',
      width: 150,
      align: 'center',
      render: (text, record) => renderYesNoSelect(text, record, 'weeklyMeeting'),
    },
    {
      title: '是否每周检查卫生，卫生干净整洁',
      dataIndex: 'weeklySanitationCheck',
      key: 'weeklySanitationCheck',
      width: 220,
      align: 'center',
      render: (text, record) => renderYesNoSelect(text, record, 'weeklySanitationCheck'),
    },
    {
      title: '是否及时解决宿舍问题，例如房东，学生，家长反馈的问题。或退宿、退租等等',
      dataIndex: 'issuesResolvedTimely',
      key: 'issuesResolvedTimely',
      width: 320,
      align: 'left',
      render: (text, record) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 3 }}
          value={text}
          onChange={(e) => handleChange(record.key, 'issuesResolvedTimely', e.target.value)}
        />
      ),
    },
    {
      title: '学员纪律',
      dataIndex: 'discipline',
      key: 'discipline',
      width: 160,
      align: 'left',
      render: (text, record) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 3 }}
          value={text}
          onChange={(e) => handleChange(record.key, 'discipline', e.target.value)}
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
      align: 'left',
      render: (text, record) => (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 3 }}
          value={text}
          onChange={(e) => handleChange(record.key, 'remark', e.target.value)}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Popconfirm title="删除此行？" okText="删除" cancelText="取消" onConfirm={() => deleteRow(record.key)}>
          <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      ),
    },
  ]

  // 与后端交互 - 刷新按钮调用
  const loadSelfCheck = async () => {
    await loadAllDormitoryData();
  }

  const saveSelfCheck = async () => {
    try {
      setSaving(true)
      const payload = {
        神殿名称: currentCampus || '',
        年份: year,
        月份: month,
        行列表: dataSource.map((r, idx) => ({
          管理老师: r.manager || '',
          序号: r.serialNumber ?? idx + 1,
          宿舍名称: r.dormitoryName || '',
          住宿人数: r.residentsCount ? parseInt(r.residentsCount, 10) : null,
          是否有投诉或重大事故: r.hasComplaintOrAccident || '',
          是否每日正常查寝: r.dailyCheck || '',
          是否按时都已收取住宿费: r.feeCollectedOnTime || '',
          是否每周开宿舍会: r.weeklyMeeting || '',
          是否每周检查卫生: r.weeklySanitationCheck || '',
          是否及时解决宿舍问题: r.issuesResolvedTimely || '',
          学员纪律: r.discipline || '',
          备注: r.remark || '',
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/dormitory-self-check-monthly'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      await loadAllDormitoryData()
    } catch (e: any) {
      console.error(e)
      message.error('保存失败：' + (e?.message || '未知错误'))
    } finally {
      setSaving(false)
    }
  }

  // 自动加载并显示所有宿舍数据
  const loadAllDormitoryData = async () => {
    if (!currentCampus) return;
    
    try {
      setLoading(true);
      const campusName = currentCampus.endsWith('神殿') ? currentCampus : `${currentCampus}神殿`;
      
      // 1. 加载宿舍租赁信息（宿舍名称和管理老师）
      const dormRes = await fetch(
        buildApiUrl(`/teaching-quality/campus-dormitory-rent-payment-info?campus=${encodeURIComponent(campusName)}&year=${year}`)
      );
      if (!dormRes.ok) throw new Error(await dormRes.text());
      const dormData = await dormRes.json();
      const dormList = (dormData?.行列表 || []).filter((d: any) => d.dormShortName);
      
      // 设置宿舍选项
      const options = dormList.map((d: any) => ({
        label: d.dormShortName,
        value: d.dormShortName,
        manager: d.dormManager,
      }));
      setDormitoryOptions(options);
      
      // 2. 加载男女宿舍详情（住宿人数）
      const urls = [
        buildApiUrl(`/teaching-quality/campus-male-dormitory-detail?campus=${encodeURIComponent(campusName)}&year=${year}`),
        buildApiUrl(`/teaching-quality/campus-female-dormitory-detail?campus=${encodeURIComponent(campusName)}&year=${year}`),
      ];
      const responses = await Promise.all(urls.map(url => fetch(url)));
      const occupancyData: Record<string, number> = {};

      for (const res of responses) {
        if (res.ok) {
          const data = await res.json();
          (data?.宿舍列表 || []).forEach((group: any) => {
            if (group.dormName && group.students) {
              occupancyData[group.dormName] = group.students.length;
            }
          });
        }
      }
      setDormOccupancy(occupancyData);
      
      // 3. 加载已保存的自查数据
      const params = new URLSearchParams({
        campus: currentCampus || '',
        year: String(year),
        month: String(month),
      });
      const selfCheckRes = await fetch(`${buildApiUrl('/teaching-quality/dormitory-self-check-monthly')}?${params.toString()}`);
      
      // 将已保存的数据存储为 Map，key 为宿舍名称
      const existingDataMap = new Map<string, any>();
      if (selfCheckRes.ok) {
        const selfCheckData = await selfCheckRes.json();
        (selfCheckData.行列表 || []).forEach((r: any) => {
          if (r.宿舍名称) {
            existingDataMap.set(r.宿舍名称, r);
          }
        });
      }
      
      // 4. 始终基于最新的宿舍列表生成数据，并合并已保存的自查信息
      // 按管理老师分组
      const managerGroups = new Map<string, typeof dormList>();
      dormList.forEach((d: any) => {
        const manager = d.dormManager || '未分配';
        if (!managerGroups.has(manager)) {
          managerGroups.set(manager, []);
        }
        managerGroups.get(manager)!.push(d);
      });
      
      // 生成行数据，合并已保存的自查信息
      const newRows: DormitorySelfCheckRow[] = [];
      managerGroups.forEach((dorms, manager) => {
        dorms.forEach((d: any, index: number) => {
          const dormName = d.dormShortName;
          const occupancy = occupancyData[dormName] || 0;
          const savedData = existingDataMap.get(dormName);
          
          newRows.push({
            key: `${manager}-${dormName}-${Date.now()}-${index}`,
            manager: manager,
            serialNumber: index + 1,
            dormitoryName: dormName,
            residentsCount: String(occupancy),
            // 如果有已保存的数据，使用已保存的值，否则为空
            hasComplaintOrAccident: savedData?.是否有投诉或重大事故 || '',
            dailyCheck: savedData?.是否每日正常查寝 || '',
            feeCollectedOnTime: savedData?.是否按时都已收取住宿费 || '',
            weeklyMeeting: savedData?.是否每周开宿舍会 || '',
            weeklySanitationCheck: savedData?.是否每周检查卫生 || '',
            issuesResolvedTimely: savedData?.是否及时解决宿舍问题 || '',
            discipline: savedData?.学员纪律 || '',
            remark: savedData?.备注 || '',
          });
        });
      });
      
      setDataSource(newRows);
      
      if (existingDataMap.size > 0) {
        message.success(`已加载 ${newRows.length} 个宿舍（含 ${existingDataMap.size} 个已填写的自查记录）`);
      } else {
        message.success(`已自动加载 ${newRows.length} 个宿舍`);
      }
    } catch (e: any) {
      console.error(e);
      message.error('加载数据失败：' + (e?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllDormitoryData();
  }, [currentCampus, year, month]);

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`宿舍管理（${currentCampus || '未选择神殿'}）- 月度自查统计`}
        extra={
          <span>
            年份：
            <Select style={{ width: 100, marginRight: 8 }} value={year} onChange={setYear}>
              <Option value={2023}>2023</Option>
              <Option value={2024}>2024</Option>
              <Option value={2025}>2025</Option>
              <Option value={2026}>2026</Option>
            </Select>
            月份：
            <Select style={{ width: 80, marginRight: 12 }} value={month} onChange={setMonth}>
              {Array.from({ length: 12 }, (_, i) => (
                <Option key={i + 1} value={i + 1}>{i + 1}</Option>
              ))}
            </Select>
            <Button type="primary" onClick={saveSelfCheck} loading={saving} style={{ marginRight: 8 }}>保存</Button>
            <Button onClick={loadSelfCheck} loading={loading}>刷新</Button>
          </span>
        }
      >
        <Table<DormitorySelfCheckRow>
          bordered
          size="small"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

export default DormitorySelfCheckSummarySheet
