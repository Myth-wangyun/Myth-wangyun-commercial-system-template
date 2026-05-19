import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { App, Table, Input, InputNumber, Button, Card, Spin, Empty, Alert } from 'antd'
import { ReloadOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import api from '@/services/api'

interface FunctionRow {
  key: string
  no: number | string
  category: string
  item: string
  requirement: string
  maxScore: number
  field: string  // 对应后端字段名
  // string index for dynamic employee scores
  [key: string]: any
}

interface StaffColumn {
  id: string
  name: string
  position: string
  role: 'manager' | 'consultant'
}

// 评分项目定义 - 与后端保持一致
const STATIC_ROWS: Omit<FunctionRow, 'key'>[] = [
  { no: 1, category: '核心业务能力', item: '招生收入', requirement: '年度整理招生收入任务完成情况', maxScore: 10, field: '招生收入' },
  { no: 2, category: '核心业务能力', item: '面转率', requirement: '当面转化报名的能力', maxScore: 5, field: '面转率' },
  { no: 3, category: '核心业务能力', item: '上门率', requirement: '年度上门率情况', maxScore: 10, field: '上门率' },
  { no: 4, category: '核心业务能力', item: '总转率', requirement: '年度总转率情况', maxScore: 10, field: '总转率' },
  { no: 5, category: '一般业务能力', item: '宣讲', requirement: '讲座能力', maxScore: 5, field: '宣讲' },
  { no: 6, category: '一般业务能力', item: '电话量', requirement: '年度电话量情况', maxScore: 5, field: '电话量' },
  { no: 7, category: '一般业务能力', item: '退费率', requirement: '年度退费情况', maxScore: 5, field: '退费率' },
  { no: 8, category: '一般业务能力', item: '数据分析', requirement: '个人总结计划能力', maxScore: 5, field: '数据分析' },
  { no: 9, category: '价值观', item: '责任心', requirement: '对待工作有责任心。', maxScore: 5, field: '责任心' },
  { no: 10, category: '价值观', item: '执行力', requirement: '能认真执行上级领导的各项安排', maxScore: 5, field: '执行力' },
  { no: 11, category: '价值观', item: '吃苦耐劳', requirement: '不辞辛苦，任劳任怨', maxScore: 5, field: '吃苦耐劳' },
  { no: 12, category: '价值观', item: '团队精神', requirement: '有大局观，个人利益服从集体利益', maxScore: 5, field: '团队精神' },
  { no: 13, category: '价值观', item: '职业化', requirement: '工装、出勤、自律性、职业化等', maxScore: 5, field: '职业化' },
  { no: 14, category: '价值观', item: '向内归因', requirement: '主动从自身找原因，不推诿给他人', maxScore: 5, field: '向内归因' },
  { no: 15, category: '价值观', item: '结果导向', requirement: '有目标感和结果意识', maxScore: 5, field: '结果导向' },
  { no: 16, category: '价值观', item: '情绪管理', requirement: '情绪稳定不大喜大悲', maxScore: 5, field: '情绪管理' },
  { no: 17, category: '价值观', item: '沟通能力', requirement: '对上级、对同事、对学生的沟通方式', maxScore: 5, field: '沟通能力' },
  { no: 18, category: '附加', item: '可异地调度', requirement: '能到外地出差1年以上。', maxScore: 20, field: '可异地调度' },
]

// 序号到字段名的映射
const NO_TO_FIELD: Record<number, string> = {}
STATIC_ROWS.forEach(row => {
  NO_TO_FIELD[row.no as number] = row.field
})

interface Props {
  campusName: string
  year: string
}

export default function StaffFunctionTable({ campusName, year }: Props) {
  const { message, notification } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [principal, setPrincipal] = useState<StaffColumn | null>(null)
  const [managers, setManagers] = useState<StaffColumn[]>([])
  const [consultants, setConsultants] = useState<StaffColumn[]>([])

  // Store scores in a map: { [staffId_itemNo]: score }
  const [scores, setScores] = useState<Record<string, number>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // 从后端加载员工数据
  const loadStaffData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get(`/consult/staff-function/campus/${encodeURIComponent(campusName)}`)
      const data = response.data
      
      if (data.principal) {
        setPrincipal({
          id: data.principal.id,
          name: data.principal.name,
          position: data.principal.position || '校长',
          role: 'manager'
        })
      } else {
        setPrincipal(null)
      }
      
      setManagers(data.managers.map((m: any) => ({
        id: m.id,
        name: m.name,
        position: m.position || '干部',
        role: 'manager' as const
      })))
      
      setConsultants(data.consultants.map((c: any) => ({
        id: c.id,
        name: c.name,
        position: c.position || '咨询师',
        role: 'consultant' as const
      })))
      
    } catch (error: any) {
      console.error('加载员工数据失败:', error)
      message.error('加载员工数据失败')
    } finally {
      setLoading(false)
    }
  }, [campusName])

  // 加载评分数据
  const loadScores = useCallback(async () => {
    try {
      const response = await api.get(`/consult/staff-function/scores/${year}/${encodeURIComponent(campusName)}`)
      const data = response.data
      
      if (data.score_map) {
        setScores(data.score_map)
      }
      setHasChanges(false)
    } catch (error: any) {
      console.error('加载评分数据失败:', error)
      // 不显示错误，可能是还没有数据
    }
  }, [year, campusName])

  // 保存所有评分
  const saveAllScores = async () => {
    setSaving(true)
    try {
      // 将 scores 转换为后端需要的格式: {员工ID: {字段名: 分数, ...}, ...}
      const allStaff = [...(principal ? [principal] : []), ...managers, ...consultants]
      const scoresData: Record<string, Record<string, number>> = {}
      
      allStaff.forEach(staff => {
        const staffScores: Record<string, number> = {}
        STATIC_ROWS.forEach(row => {
          const key = `${staff.id}_${row.no}`
          const score = scores[key] || 0
          staffScores[row.field] = score
        })
        scoresData[staff.id] = staffScores
      })
      
      await api.post('/consult/staff-function/scores/save', {
        年份: parseInt(year),
        神殿: campusName,
        scores: scoresData
      })
      
      notification.success({ message: '已保存', description: '评分数据保存成功', placement: 'topRight', duration: 3 })
      setHasChanges(false)
    } catch (error: any) {
      console.error('保存评分失败:', error)
      notification.error({ message: '保存失败', description: error.response?.data?.detail || error.message || '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 })
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (campusName) {
      loadStaffData()
    }
  }, [campusName, loadStaffData])

  useEffect(() => {
    if (campusName && year) {
      loadScores()
    }
  }, [campusName, year, loadScores])

  // Helper to get score safely
  const getScore = (rowNo: number | string, staffId: string) => {
    return scores[`${staffId}_${rowNo}`]
  }

  const handleScoreChange = (rowNo: number | string, staffId: string, val: number | null) => {
    setScores(prev => ({
      ...prev,
      [`${staffId}_${rowNo}`]: val || 0
    }))
    setHasChanges(true)
  }

  const columns: ColumnsType<FunctionRow> = useMemo(() => {
    const allStaff = [...(principal ? [principal] : []), ...managers, ...consultants]
    
    const cols: ColumnsType<FunctionRow> = [
      {
        title: '神殿',
        dataIndex: 'campus',
        width: 60,
        fixed: 'left',
        onCell: (record, index) => {
           if (index === 0) {
              return { rowSpan: 19 } // 18 rows + 1 total row
           }
           return { rowSpan: 0 }
        },
        render: () => <div style={{ fontWeight: 'bold', writingMode: 'vertical-rl', fontSize: '18px', letterSpacing: '6px', margin: '0 auto' }}>{campusName.replace(/神殿$/, '')}</div>
      },
      {
        title: '序号',
        dataIndex: 'no',
        width: 50,
        align: 'center',
        onCell: (record) => {
          if (record.no === 'total') {
            return { colSpan: 4 }  // 序号+类别+功能项目+详细要求 = 4列
          }
          return {}
        },
        render: (val, record) => record.no === 'total' ? '合计' : val
      },
      {
        title: '类别',
        dataIndex: 'category',
        width: 80,
        align: 'center',
        onCell: (record, index) => {
           if (record.no === 'total') {
              return { colSpan: 0 }
           }
           if (record.no === 1) return { rowSpan: 4 }
           if (typeof record.no === 'number' && record.no >= 2 && record.no <= 4) return { rowSpan: 0 }
           
           if (record.no === 5) return { rowSpan: 4 }
           if (typeof record.no === 'number' && record.no >= 6 && record.no <= 8) return { rowSpan: 0 }

           if (record.no === 9) return { rowSpan: 9 }
           if (typeof record.no === 'number' && record.no >= 10 && record.no <= 17) return { rowSpan: 0 }
           
           return {}
        }
      },
      {
        title: '功能项目',
        dataIndex: 'item',
        width: 80,
        align: 'center',
         onCell: (record) => {
             if (record.no === 'total') return { colSpan: 0 }
             return {}
         }
      },
      {
        title: '详细要求',
        dataIndex: 'requirement',
        width: 180,
         onCell: (record) => {
             if (record.no === 'total') return { colSpan: 0 }
             return {}
         }
      },
      {
        title: '满分',
        dataIndex: 'maxScore',
        width: 50,
        align: 'center',
        render: (val, record) => {
           if (record.no === 'total') {
             return 120
           }
           return val
        }
      },
    ]

    // 校长列（如果有）
    if (principal) {
      cols.push({
        title: '校长',
        key: 'principal',
        width: 70,
        align: 'center',
        render: (_: any, record: FunctionRow) => {
           if (record.no === 'total') {
              const total = STATIC_ROWS.reduce((acc, row) => acc + (getScore(row.no as number, principal.id) || 0), 0)
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
           }
           return (
             <InputNumber 
               min={0} 
               max={record.maxScore} 
               value={getScore(record.no as number, principal.id)}
               onChange={val => handleScoreChange(record.no as number, principal.id, val)}
               bordered={false}
               size="small"
               style={{ width: '100%', textAlign: 'center' }}
             />
           )
        },
        children: [{
          title: principal.name,
          key: principal.id,
          width: 70,
          align: 'center',
          render: (_: any, record: FunctionRow) => {
             if (record.no === 'total') {
                const total = STATIC_ROWS.reduce((acc, row) => acc + (getScore(row.no as number, principal.id) || 0), 0)
                return <span style={{ fontWeight: 'bold' }}>{total}</span>
             }
             return (
               <InputNumber 
                 min={0} 
                 max={record.maxScore} 
                 value={getScore(record.no as number, principal.id)}
                 onChange={val => handleScoreChange(record.no as number, principal.id, val)}
                 bordered={false}
                 size="small"
                 style={{ width: '100%', textAlign: 'center' }}
               />
             )
          }
        }]
      })
    }

    // Manager Columns
    if (managers.length > 0) {
      const managerGroup: any = {
        title: `干部${managers.length}`,
        children: managers.map((m) => ({
          title: m.name,
          key: m.id,
          width: 70,
          align: 'center',
          render: (_: any, record: FunctionRow) => {
             if (record.no === 'total') {
                const total = STATIC_ROWS.reduce((acc, row) => acc + (getScore(row.no as number, m.id) || 0), 0)
                return <span style={{ fontWeight: 'bold' }}>{total}</span>
             }
             return (
               <InputNumber 
                 min={0} 
                 max={record.maxScore} 
                 value={getScore(record.no as number, m.id)}
                 onChange={val => handleScoreChange(record.no as number, m.id, val)}
                 bordered={false}
                 size="small"
                 style={{ width: '100%', textAlign: 'center' }}
               />
             )
          }
        }))
      }
      cols.push(managerGroup)
    }

    // Consultant Columns
    if (consultants.length > 0) {
      const consultantGroup: any = {
        title: `咨询师${consultants.length}`,
        children: consultants.map((c) => ({
          title: c.name,
          key: c.id,
          width: 70,
          align: 'center',
          render: (_: any, record: FunctionRow) => {
             if (record.no === 'total') {
                const total = STATIC_ROWS.reduce((acc, row) => acc + (getScore(row.no as number, c.id) || 0), 0)
                return <span style={{ fontWeight: 'bold' }}>{total}</span>
             }
             return (
               <InputNumber 
                 min={0} 
                 max={record.maxScore} 
                 value={getScore(record.no as number, c.id)}
                 onChange={val => handleScoreChange(record.no as number, c.id, val)}
                 bordered={false}
                 size="small"
                 style={{ width: '100%', textAlign: 'center' }}
               />
             )
          }
        }))
      }
      cols.push(consultantGroup)
    }

    return cols
  }, [principal, managers, consultants, scores, campusName])

  const dataSource = useMemo(() => {
     const rows = STATIC_ROWS.map((row) => ({
        ...row,
        key: String(row.no),
     })) as FunctionRow[]
     
     rows.push({
        key: 'total',
        no: 'total',
        category: '',
        item: '',
        requirement: '',
        maxScore: 120,
        field: 'total'
     })
     
     return rows
  }, [])

  return (
    <Spin spinning={loading || saving}>
      <Card bodyStyle={{ padding: 0 }}>
         <div style={{ 
           background: '#ffc000', 
           padding: '12px', 
           textAlign: 'center', 
           fontWeight: 'bold', 
           fontSize: '18px',
           borderBottom: '1px solid #f0f0f0',
           display: 'flex',
           justifyContent: 'space-between',
           alignItems: 'center'
         }}>
           <span></span>
           <span>清美教育祈福司员工功能分析表（{year}）</span>
           <div style={{ display: 'flex', gap: 8 }}>
             <Button 
               icon={<SaveOutlined />} 
               onClick={saveAllScores}
               type={hasChanges ? 'primary' : 'default'}
               size="small"
               loading={saving}
             >
               保存
             </Button>
             <Button 
               icon={<ReloadOutlined />} 
               onClick={() => { loadStaffData(); loadScores(); }}
               size="small"
             >
               刷新
             </Button>
           </div>
         </div>

         {/* 无员工数据时显示提示 */}
         {!loading && !principal && managers.length === 0 && consultants.length === 0 ? (
           <div style={{ padding: '40px 24px' }}>
             <Empty
               image={<UserOutlined style={{ fontSize: 64, color: '#bfbfbf' }} />}
               imageStyle={{ height: 80 }}
               description={
                 <div>
                   <div style={{ fontSize: 16, color: '#595959', marginBottom: 8 }}>
                     {campusName} 暂无祈福司员工数据
                   </div>
                   <Alert
                     type="info"
                     showIcon
                     message="如何添加员工"
                     description={
                       <span>
                         009表的员工列表来自系统<strong>用户管理</strong>，请联系管理员在用户管理中为该神殿添加祈福司账号。
                         <br />
                         要求：<strong>部门</strong>设为"祈福司"，<strong>神殿</strong>填写含省份前缀的完整名称（如：广西神恩殿、山西光明殿）。
                         <br />
                         添加完成后点击"刷新"按钮即可显示。
                       </span>
                     }
                     style={{ marginTop: 12, textAlign: 'left' }}
                   />
                 </div>
               }
             />
           </div>
         ) : (
           <>
             {/* 统计信息 */}
             <div style={{ padding: '8px 16px', background: '#f5f5f5', display: 'flex', gap: 24 }}>
               <span>校长: {principal ? 1 : 0}人</span>
               <span>干部: {managers.length}人</span>
               <span>咨询师: {consultants.length}人</span>
               <span>合计: {(principal ? 1 : 0) + managers.length + consultants.length}人</span>
             </div>
             
             <Table
               columns={columns}
               dataSource={dataSource}
               pagination={false}
               bordered
               size="small"
               scroll={{ x: 'max-content' }}
               rowClassName={(record) => record.no === 'total' ? 'total-row' : ''}
             />
           </>
         )}
         <style>{`
           .ant-table-thead > tr > th {
             background-color: #e2efda !important;
             text-align: center !important;
             border-color: #000 !important;
             color: #000 !important;
             padding: 4px !important;
             font-size: 12px !important;
           }
           .ant-table-tbody > tr > td {
             border-color: #000 !important;
             padding: 2px 4px !important;
             font-size: 12px !important;
           }
           .ant-table-bordered .ant-table-container {
             border-color: #000 !important;
           }
           .total-row {
              font-weight: bold;
              background-color: #f0f0f0;
           }
           .ant-input-number {
             font-size: 12px !important;
           }
           .ant-input-number-input {
             text-align: center !important;
             padding: 0 !important;
           }
         `}</style>
      </Card>
    </Spin>
  )
}
