import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { App, Table, InputNumber, Button, Modal, Form, Input, Space, Popconfirm, Spin } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { marketStaffFunctionService, type MiddleManagementEmployeeData } from '@/services/market/marketStaffFunction'

interface MiddleManagementTabProps {
  year: string
  month: string
}

// 员工类型
interface Employee {
  key: string
  name: string
  position: string
}

// 功能分析行数据类型
interface FunctionAnalysisRow {
  id: number
  category: string // 类别
  categoryRowSpan?: number // 类别合并行数
  functionItem: string // 功能项目
  detailRequirement: string // 详细要求
  standardScore: number // 标准分
  weight: number // 权重
  // 员工得分列
  [key: string]: any
  isTotal?: boolean // 是否是合计行
}

// 中层功能分析数据 - 按照图片中的结构
const middleManagementData: FunctionAnalysisRow[] = [
  // 价值观 (1-5行，共5行)
  { id: 1, category: '价值观', categoryRowSpan: 5, functionItem: '价值观趋同度', detailRequirement: '认同并贯彻清美价值观', standardScore: 5, weight: 0 },
  { id: 2, category: '价值观', functionItem: '执行力', detailRequirement: '能认真高效执行上级领导的各项安排', standardScore: 5, weight: 0 },
  { id: 3, category: '价值观', functionItem: '努力程度', detailRequirement: '不辞辛苦，任劳任怨', standardScore: 5, weight: 0 },
  { id: 4, category: '价值观', functionItem: '团队精神', detailRequirement: '具备团队合作和协调能力', standardScore: 5, weight: 0 },
  { id: 5, category: '价值观', functionItem: '职业道德', detailRequirement: '具备良好的职业素养', standardScore: 5, weight: 0 },
  // 部门业务管理 (6-13行，共8行)
  { id: 6, category: '部门业务管理', categoryRowSpan: 8, functionItem: '市场部门考核制定与执行', detailRequirement: '部门的目标年度，月度目标分解与kpi考试指标制定', standardScore: 5, weight: 0 },
  { id: 7, category: '部门业务管理', functionItem: '市场部门标准化工作流程管理', detailRequirement: '市场部标准化工作流程的监督与把控', standardScore: 5, weight: 0 },
  { id: 8, category: '部门业务管理', functionItem: '市场部门总结与计划制定', detailRequirement: '市场部门月度和年度总结计划独立制定能力', standardScore: 5, weight: 0 },
  { id: 9, category: '部门业务管理', functionItem: '部门业绩达成情况', detailRequirement: '市场部门业绩达成情况', standardScore: 10, weight: 0 },
  { id: 10, category: '部门业务管理', functionItem: '不同季节市场人群把控', detailRequirement: '市场团队季节转换指导团队完成人群特点的培训与适应过程', standardScore: 5, weight: 0 },
  { id: 11, category: '部门业务管理', functionItem: '市场内部会议组织', detailRequirement: '市场部内部临时、突发（晚上）和重点需求会议组织执行响应', standardScore: 5, weight: 0 },
  { id: 12, category: '部门业务管理', functionItem: '市场内部板块配合', detailRequirement: '网推、网聊、新媒体、AI研发中发挥协调配合度', standardScore: 5, weight: 0 },
  { id: 13, category: '部门业务管理', functionItem: '市场部门会议组织', detailRequirement: '周、阶段、月度及年度总结会的有效召开', standardScore: 5, weight: 0 },
  // 部门团队建设与管理 (14-19行，共6行)
  { id: 14, category: '部门团队建设与管理', categoryRowSpan: 6, functionItem: '建设并维护团队能力', detailRequirement: '发现员工心态问题并及时调整', standardScore: 5, weight: 0 },
  { id: 15, category: '部门团队建设与管理', functionItem: '员工培训', detailRequirement: '能够独立完成新人、老员工培训与赋能', standardScore: 5, weight: 0 },
  { id: 16, category: '部门团队建设与管理', functionItem: '员工心态调整', detailRequirement: '能够招聘并组建市场团队确保职数达标，队伍人员相对稳定', standardScore: 5, weight: 0 },
  { id: 17, category: '部门团队建设与管理', functionItem: '优化团队能力', detailRequirement: '实现对市场团队的优胜劣汰', standardScore: 5, weight: 0 },
  { id: 18, category: '部门团队建设与管理', functionItem: '后进员工帮扶能力', detailRequirement: '有效帮扶后进人员实现业绩提升', standardScore: 5, weight: 0 },
  { id: 19, category: '部门团队建设与管理', functionItem: '优秀员工打造能力', detailRequirement: '培养部门业绩排名前三的专业（独当一面）人员', standardScore: 5, weight: 0 },
  // 附加 (20行，共1行)
  { id: 20, category: '附加', categoryRowSpan: 1, functionItem: '可异地调度', detailRequirement: '能到外地出差1年以上。', standardScore: 20, weight: 0 },
]

// 默认员工列表
const defaultEmployees: Employee[] = [
  { key: 'hanWeiming', name: '韩维明', position: '市场部经理' },
  { key: 'kangQing', name: '康青', position: '市场部副经理' },
  { key: 'xueYuehua', name: '薛跃华', position: '市场部助理' },
]

const MiddleManagementTab: React.FC<MiddleManagementTabProps> = ({ year, month }) => {
  const { message } = App.useApp()
  // 加载状态
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  // 员工列表状态
  const [employees, setEmployees] = useState<Employee[]>(defaultEmployees)
  // 员工评分状态 { rowId: { employeeKey: score } }
  const [ratings, setRatings] = useState<Record<number, Record<string, number>>>({})
  // 权重状态 { rowId: weight }
  const [weights, setWeights] = useState<Record<number, number>>({})
  // 弹窗状态
  const [modalVisible, setModalVisible] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [form] = Form.useForm()

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await marketStaffFunctionService.middleManagement.getData(year)
      
      // 如果有数据，更新状态
      if (response.employees && response.employees.length > 0) {
        const loadedEmployees: Employee[] = response.employees.map((emp, idx) => ({
          key: emp.employee_key,
          name: emp.employee_name,
          position: emp.position || '',
        }))
        setEmployees(loadedEmployees)

        // 转换评分数据格式
        const loadedRatings: Record<number, Record<string, number>> = {}
        response.employees.forEach(emp => {
          Object.entries(emp.ratings || {}).forEach(([rowId, rating]) => {
            const rid = Number(rowId)
            if (!loadedRatings[rid]) {
              loadedRatings[rid] = {}
            }
            loadedRatings[rid][emp.employee_key] = rating
          })
        })
        setRatings(loadedRatings)
      }

      // 加载权重
      if (response.weights) {
        const loadedWeights: Record<number, number> = {}
        Object.entries(response.weights).forEach(([rowId, weight]) => {
          loadedWeights[Number(rowId)] = weight
        })
        setWeights(loadedWeights)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      // 如果加载失败，使用默认数据
    } finally {
      setLoading(false)
    }
  }, [year])

  // 保存数据
  const handleSave = async () => {
    setSaving(true)
    try {
      // 构建保存数据
      const employeesData: MiddleManagementEmployeeData[] = employees.map(emp => {
        const empRatings: Record<number, number> = {}
        middleManagementData.forEach(row => {
          const rating = ratings[row.id]?.[emp.key]
          if (rating !== undefined && rating !== 0) {
            empRatings[row.id] = rating
          }
        })
        return {
          employee_key: emp.key,
          employee_name: emp.name,
          position: emp.position,
          ratings: empRatings,
        }
      })

      await marketStaffFunctionService.middleManagement.save({
        year,
        employees: employeesData,
        weights,
      })
      message.success('保存成功')
    } catch (error) {
      console.error('保存失败:', error)
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 年份变化时重新加载数据
  useEffect(() => {
    loadData()
  }, [loadData])

  // 更新员工评分
  const handleRatingChange = (rowId: number, employeeKey: string, value: number | null) => {
    setRatings(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [employeeKey]: value ?? 0
      }
    }))
  }

  // 更新权重
  const handleWeightChange = (rowId: number, value: number | null) => {
    setWeights(prev => ({
      ...prev,
      [rowId]: value ?? 0
    }))
  }

  // 计算得分 = 评分 * 权重百分比
  const calculateScore = (rowId: number, employeeKey: string): number => {
    const rating = ratings[rowId]?.[employeeKey] ?? 0
    const weight = (weights[rowId] ?? 0) / 100 // 权重是百分比，需要除以100
    return Number((rating * weight).toFixed(2))
  }

  // 计算权重总和（百分比）
  const calculateTotalWeight = (): number => {
    let total = 0
    middleManagementData.forEach(row => {
      total += weights[row.id] ?? 0
    })
    return total
  }

  // 获取权重总和
  const totalWeight = useMemo(() => calculateTotalWeight(), [weights])

  // 计算员工总得分
  const calculateEmployeeTotal = (employeeKey: string): number => {
    let total = 0
    middleManagementData.forEach(row => {
      total += calculateScore(row.id, employeeKey)
    })
    return Number(total.toFixed(2))
  }

  // 添加员工
  const handleAddEmployee = () => {
    setEditingEmployee(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑员工
  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    form.setFieldsValue({ name: employee.name, position: employee.position })
    setModalVisible(true)
  }

  // 删除员工
  const handleDeleteEmployee = (key: string) => {
    if (employees.length <= 1) {
      message.warning('至少保留一名员工')
      return
    }
    setEmployees(employees.filter(emp => emp.key !== key))
    // 清除该员工的评分数据
    setRatings(prev => {
      const newRatings = { ...prev }
      Object.keys(newRatings).forEach(rowId => {
        if (newRatings[Number(rowId)]) {
          delete newRatings[Number(rowId)][key]
        }
      })
      return newRatings
    })
    message.success('删除成功')
  }

  // 保存员工
  const handleSaveEmployee = () => {
    form.validateFields().then(values => {
      if (editingEmployee) {
        // 编辑
        setEmployees(employees.map(emp => 
          emp.key === editingEmployee.key ? { ...emp, name: values.name, position: values.position } : emp
        ))
        message.success('修改成功')
      } else {
        // 新增
        const newKey = `employee_${Date.now()}`
        setEmployees([...employees, { key: newKey, name: values.name, position: values.position }])
        message.success('添加成功')
      }
      setModalVisible(false)
      form.resetFields()
    })
  }

  // 计算合计行（包含员工总得分）
  const dataWithTotal = useMemo(() => {
    const totalRow: FunctionAnalysisRow = {
      id: 0,
      category: '合计',
      functionItem: '',
      detailRequirement: '',
      standardScore: middleManagementData.reduce((sum, row) => sum + row.standardScore, 0),
      weight: 0,
      isTotal: true,
    }
    // 为每个员工计算总得分
    employees.forEach(emp => {
      totalRow[`${emp.key}_rating`] = 0
      totalRow[`${emp.key}_score`] = calculateEmployeeTotal(emp.key)
    })
    return [...middleManagementData, totalRow]
  }, [employees, ratings, weights])

  // 表格列定义
  const columns: ColumnsType<FunctionAnalysisRow> = useMemo(() => {
    const baseColumns: ColumnsType<FunctionAnalysisRow> = [
      {
        title: '序号',
        dataIndex: 'id',
        key: 'id',
        width: 50,
        align: 'center',
        render: (value, record) => record.isTotal ? '' : value,
      },
      {
        title: '类别',
        dataIndex: 'category',
        key: 'category',
        width: 120,
        align: 'center',
        onCell: (record) => {
          if (record.isTotal) {
            return {}
          }
          // 使用 categoryRowSpan 来控制合并
          if (record.categoryRowSpan) {
            return { rowSpan: record.categoryRowSpan }
          }
          return { rowSpan: 0 }
        },
        render: (value) => value,
      },
      {
        title: '功能项目',
        dataIndex: 'functionItem',
        key: 'functionItem',
        width: 180,
        align: 'center',
      },
      {
        title: '详细要求',
        dataIndex: 'detailRequirement',
        key: 'detailRequirement',
        width: 300,
        align: 'center',
      },
      {
        title: '标准分',
        dataIndex: 'standardScore',
        key: 'standardScore',
        width: 70,
        align: 'center',
      },
      {
        title: '权重',
        dataIndex: 'weight',
        key: 'weight',
        width: 80,
        align: 'center',
        render: (value, record) => {
          if (record.isTotal) {
            const total = totalWeight
            return (
              <span style={{ 
                fontWeight: 'bold', 
                color: total === 100 ? '#52c41a' : '#ff4d4f' 
              }}>
                {total}%
              </span>
            )
          }
          return (
            <InputNumber
              value={weights[record.id] ?? value ?? null}
              style={{ width: '100%' }}
              size="small"
              controls={false}
              min={0}
              max={100}
              step={1}
              formatter={(val) => val ? `${val}%` : ''}
              parser={(val) => val ? Number(val.replace('%', '')) : 0}
              onChange={(val) => handleWeightChange(record.id, val)}
            />
          )
        }
      },
    ]

    // 添加市场部员工列（带两行表头：姓名和职位，以及操作按钮）
    const marketDeptHeader: ColumnsType<FunctionAnalysisRow>[0] = {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span>市场部</span>
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleAddEmployee}
          >
            添加
          </Button>
        </div>
      ),
      align: 'center',
      children: employees.map(emp => ({
        title: (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold' }}>{emp.name}</div>
            <div style={{ fontSize: '12px', color: '#333', fontWeight: 'normal' }}>{emp.position}</div>
            <Space size={4} style={{ marginTop: 4 }}>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditEmployee(emp)}
                style={{ padding: 0, height: 'auto', fontSize: 12 }}
              />
              <Popconfirm
                title="确定删除该员工吗？"
                onConfirm={() => handleDeleteEmployee(emp.key)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  style={{ padding: 0, height: 'auto', fontSize: 12 }}
                />
              </Popconfirm>
            </Space>
          </div>
        ),
        align: 'center' as const,
        children: [
          {
            title: '评分',
            dataIndex: `${emp.key}_rating`,
            key: `${emp.key}_rating`,
            width: 70,
            align: 'center' as const,
            render: (_: any, record: FunctionAnalysisRow) => {
              if (record.isTotal) {
                // 计算该员工的总评分
                let totalRating = 0
                middleManagementData.forEach(row => {
                  totalRating += ratings[row.id]?.[emp.key] ?? 0
                })
                return <span style={{ fontWeight: 'bold' }}>{totalRating || 0}</span>
              }
              return (
                <InputNumber
                  value={ratings[record.id]?.[emp.key] ?? null}
                  style={{ width: '100%' }}
                  size="small"
                  controls={false}
                  min={0}
                  max={record.standardScore}
                  onChange={(val) => handleRatingChange(record.id, emp.key, val)}
                />
              )
            }
          },
          {
            title: '得分',
            dataIndex: `${emp.key}_score`,
            key: `${emp.key}_score`,
            width: 70,
            align: 'center' as const,
            render: (_: any, record: FunctionAnalysisRow) => {
              if (record.isTotal) {
                return <span style={{ fontWeight: 'bold' }}>{calculateEmployeeTotal(emp.key)}</span>
              }
              const score = calculateScore(record.id, emp.key)
              return <span>{score || ''}</span>
            }
          }
        ]
      })),
    }

    return [...baseColumns, marketDeptHeader]
  }, [employees, ratings, weights])

  return (
    <Spin spinning={loading}>
      <div>
        <div
          style={{
            marginBottom: 0,
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            padding: '8px',
            backgroundColor: '#c6e0b4',
            border: '1px solid #000',
            borderBottom: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ flex: 1, textAlign: 'center' }}>集团网络业务线中层及以上干部功能分析表</span>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            保存
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={dataWithTotal}
          rowKey="id"
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1000 + employees.length * 140 }}
          rowClassName={(record) => record.isTotal ? 'total-row' : ''}
        />

        {/* 员工编辑弹窗 */}
        <Modal
          title={editingEmployee ? '编辑员工' : '添加员工'}
          open={modalVisible}
          onOk={handleSaveEmployee}
          onCancel={() => {
            setModalVisible(false)
            form.resetFields()
          }}
          okText="保存"
          cancelText="取消"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="员工姓名"
              rules={[{ required: true, message: '请输入员工姓名' }]}
            >
              <Input placeholder="请输入员工姓名" />
            </Form.Item>
            <Form.Item
              name="position"
              label="职位"
              rules={[{ required: true, message: '请输入职位' }]}
            >
              <Input placeholder="请输入职位" />
            </Form.Item>
          </Form>
        </Modal>

        <style>{`
          .ant-table-container table { border-color: #000 !important; }
          .ant-table-thead > tr > th {
            background-color: #c6e0b4 !important;
            border-color: #000 !important;
            font-weight: bold;
            text-align: center !important;
            vertical-align: middle !important;
          }
          .ant-table-tbody > tr > td { 
            border-color: #000 !important; 
            vertical-align: middle !important;
          }
          .ant-table-cell { padding: 6px 8px !important; }
          .total-row { background-color: #fff2cc !important; }
          .total-row td { background-color: #fff2cc !important; font-weight: bold; }
          .ant-input-number {
            border: none !important;
            box-shadow: none !important;
          }
          .ant-input-number-input {
            text-align: center;
          }
          .ant-table-thead > tr:first-child > th {
            border-bottom: 1px solid #000 !important;
          }
        `}</style>
      </div>
    </Spin>
  )
}

export default MiddleManagementTab
