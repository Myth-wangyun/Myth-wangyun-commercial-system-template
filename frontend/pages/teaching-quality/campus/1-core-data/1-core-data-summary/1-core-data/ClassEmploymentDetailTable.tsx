import React, { useMemo, memo } from 'react'
import { Card, Table, Typography, Row, Col, Statistic, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

export interface ClassEmploymentDetailTableProps {
  classId?: string
}

interface StudentEmploymentDetail {
  key: string
  classId: string
  name: string
  gender: string
  age: number
  reportedMajor: string
  education: string
  specialization: string
  graduationSchool: string
  highestCertificate: string
  phone: string
  address: string
  entryDate: string
  employmentArea: string
  employmentUnit: string
  employmentPosition: string
  probationSalary: number
  regularSalary: number
  followUpSalary: number
}

const STUDENT_DETAILS: StudentEmploymentDetail[] = [
  // Y32 班
  {
    key: 'Y32-1',
    classId: 'Y32',
    name: '张三',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '石家庄市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138001',
    address: '河北省石家庄市',
    entryDate: '2024-06-15',
    employmentArea: '北京',
    employmentUnit: '北京科技有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 4500,
    regularSalary: 6000,
    followUpSalary: 6500,
  },
  {
    key: 'Y32-2',
    classId: 'Y32',
    name: '李四',
    gender: '女',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '保定市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138002',
    address: '河北省保定市',
    entryDate: '2024-06-20',
    employmentArea: '北京',
    employmentUnit: '北京软件股份有限公司',
    employmentPosition: '开发工程师',
    probationSalary: 5000,
    regularSalary: 6500,
    followUpSalary: 7000,
  },
  {
    key: 'Y32-3',
    classId: 'Y32',
    name: '王五',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '唐山市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138003',
    address: '河北省唐山市',
    entryDate: '2024-06-25',
    employmentArea: '上海',
    employmentUnit: '上海信息科技有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 4800,
    regularSalary: 6200,
    followUpSalary: 6800,
  },
  {
    key: 'Y32-4',
    classId: 'Y32',
    name: '赵六',
    gender: '女',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '邯郸市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138004',
    address: '河北省邯郸市',
    entryDate: '2024-07-01',
    employmentArea: '北京',
    employmentUnit: '北京科技股份有限公司',
    employmentPosition: '测试工程师',
    probationSalary: 4200,
    regularSalary: 5800,
    followUpSalary: 6300,
  },
  {
    key: 'Y32-5',
    classId: 'Y32',
    name: '钱七',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '邢台市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138005',
    address: '河北省邢台市',
    entryDate: '2024-07-05',
    employmentArea: '北京',
    employmentUnit: '北京信息技术有限公司',
    employmentPosition: '开发工程师',
    probationSalary: 4900,
    regularSalary: 6400,
    followUpSalary: 6900,
  },
  // Y33 班
  {
    key: 'Y33-1',
    classId: 'Y33',
    name: '周九',
    gender: '男',
    age: 19,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '廊坊市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138007',
    address: '河北省廊坊市',
    entryDate: '2024-06-18',
    employmentArea: '北京',
    employmentUnit: '北京网络科技有限公司',
    employmentPosition: '网络工程师',
    probationSalary: 4600,
    regularSalary: 5900,
    followUpSalary: 6400,
  },
  {
    key: 'Y33-2',
    classId: 'Y33',
    name: '吴十',
    gender: '女',
    age: 20,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '承德市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138008',
    address: '河北省承德市',
    entryDate: '2024-06-22',
    employmentArea: '北京',
    employmentUnit: '北京通信技术有限公司',
    employmentPosition: '网络工程师',
    probationSalary: 4800,
    regularSalary: 6200,
    followUpSalary: 6700,
  },
  {
    key: 'Y33-3',
    classId: 'Y33',
    name: '郑十一',
    gender: '男',
    age: 19,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '张家口市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138009',
    address: '河北省张家口市',
    entryDate: '2024-06-28',
    employmentArea: '上海',
    employmentUnit: '上海网络股份有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 5000,
    regularSalary: 6500,
    followUpSalary: 7000,
  },
  {
    key: 'Y33-4',
    classId: 'Y33',
    name: '王十二',
    gender: '女',
    age: 20,
    reportedMajor: '网络工程',
    education: '中专',
    specialization: '网络工程',
    graduationSchool: '秦皇岛市职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138010',
    address: '河北省秦皇岛市',
    entryDate: '2024-07-03',
    employmentArea: '北京',
    employmentUnit: '北京互联网科技有限公司',
    employmentPosition: '网络工程师',
    probationSalary: 4700,
    regularSalary: 6100,
    followUpSalary: 6600,
  },
  // Y34 班
  {
    key: 'Y34-1',
    classId: 'Y34',
    name: '褚十五',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '保定市第二职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138013',
    address: '河北省保定市',
    entryDate: '2024-06-17',
    employmentArea: '北京',
    employmentUnit: '北京云计算科技有限公司',
    employmentPosition: '云运维工程师',
    probationSalary: 5200,
    regularSalary: 6700,
    followUpSalary: 7200,
  },
  {
    key: 'Y34-2',
    classId: 'Y34',
    name: '卫十六',
    gender: '女',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '唐山市第二职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138014',
    address: '河北省唐山市',
    entryDate: '2024-06-21',
    employmentArea: '北京',
    employmentUnit: '北京大数据科技有限公司',
    employmentPosition: '数据工程师',
    probationSalary: 5100,
    regularSalary: 6600,
    followUpSalary: 7100,
  },
  {
    key: 'Y34-3',
    classId: 'Y34',
    name: '蒋十七',
    gender: '男',
    age: 19,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '邯郸市第二职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138015',
    address: '河北省邯郸市',
    entryDate: '2024-06-26',
    employmentArea: '上海',
    employmentUnit: '上海云计算股份有限公司',
    employmentPosition: '云开发工程师',
    probationSalary: 5300,
    regularSalary: 6800,
    followUpSalary: 7300,
  },
  {
    key: 'Y34-4',
    classId: 'Y34',
    name: '沈十八',
    gender: '女',
    age: 20,
    reportedMajor: '云计算',
    education: '中专',
    specialization: '云计算',
    graduationSchool: '邢台市第二职业技术学校',
    highestCertificate: '中专毕业证书',
    phone: '13800138016',
    address: '河北省邢台市',
    entryDate: '2024-07-02',
    employmentArea: '北京',
    employmentUnit: '北京云计算服务有限公司',
    employmentPosition: '运维工程师',
    probationSalary: 5000,
    regularSalary: 6500,
    followUpSalary: 7000,
  },
]

const CLASS_META: Record<
  string,
  {
    className: string
    teacher: string
    counselor: string
    requiredEmployment: number
    targetAverageSalary: number
  }
> = {
  Y32: {
    className: 'Y32班',
    teacher: '王老师',
    counselor: '李班主任',
    requiredEmployment: 20,
    targetAverageSalary: 7000,
  },
  Y33: {
    className: 'Y33班',
    teacher: '赵老师',
    counselor: '陈班主任',
    requiredEmployment: 18,
    targetAverageSalary: 6800,
  },
  Y34: {
    className: 'Y34班',
    teacher: '刘老师',
    counselor: '孙班主任',
    requiredEmployment: 18,
    targetAverageSalary: 6900,
  },
}

// 常量化 columns，避免每次渲染都重新创建，导致 Table 组件认为 props 变了
const COLUMNS: ColumnsType<StudentEmploymentDetail> = [
  {
    title: '序号',
    dataIndex: 'key',
    width: 60,
    align: 'center',
    fixed: 'left',
    render: (_value, _record, index) => index + 1,
  },
  { title: '姓名', dataIndex: 'name', width: 90, fixed: 'left', align: 'center' },
  { title: '性别', dataIndex: 'gender', width: 70, align: 'center' },
  { title: '年龄', dataIndex: 'age', width: 70, align: 'center' },
  { title: '所报专业', dataIndex: 'reportedMajor', width: 120, align: 'center' },
  { title: '学历', dataIndex: 'education', width: 100, align: 'center' },
  { title: '专业', dataIndex: 'specialization', width: 120, align: 'center' },
  { title: '毕业学校', dataIndex: 'graduationSchool', width: 160 },
  { title: '目前所获最高学历证书及性质', dataIndex: 'highestCertificate', width: 220 },
  { title: '联系电话', dataIndex: 'phone', width: 140 },
  { title: '通信地址', dataIndex: 'address', width: 200 },
  { title: '入职时间', dataIndex: 'entryDate', width: 120, align: 'center' },
  { title: '就业地区', dataIndex: 'employmentArea', width: 120, align: 'center' },
  { title: '就业单位', dataIndex: 'employmentUnit', width: 200 },
  { title: '就业岗位', dataIndex: 'employmentPosition', width: 160 },
  {
    title: '试用期薪资',
    dataIndex: 'probationSalary',
    width: 120,
    align: 'center',
    render: (value: number) => (value ? `¥${value}` : '-'),
  },
  {
    title: '转正薪资',
    dataIndex: 'regularSalary',
    width: 120,
    align: 'center',
    render: (value: number) => (value ? `¥${value}` : '-'),
  },
  {
    title: '回访考核薪资',
    dataIndex: 'followUpSalary',
    width: 140,
    align: 'center',
    render: (value: number) => (value ? `¥${value}` : '-'),
  },
]

// 使用 React.memo 包装组件，以防止不必要的重渲染
const ClassEmploymentDetailTable: React.FC<ClassEmploymentDetailTableProps> = memo(({ classId }) => {
  const dataSource = useMemo(() => {
    if (!classId) return STUDENT_DETAILS
    return STUDENT_DETAILS.filter((record) => record.classId === classId)
  }, [classId])

  const meta = classId ? CLASS_META[classId] : undefined
  const totalRecords = dataSource.length
  const actualEmploymentCount = dataSource.length
  const actualEmploymentRate =
    meta && meta.requiredEmployment ? actualEmploymentCount / meta.requiredEmployment : 0
  const highSalaryCount = dataSource.filter((item) => item.regularSalary >= 7000).length
  const actualHighEmploymentRate = totalRecords ? highSalaryCount / totalRecords : 0
  const averageSalary = totalRecords
    ? Math.round(dataSource.reduce((sum, item) => sum + item.regularSalary, 0) / totalRecords)
    : 0
  const employmentTargetAchieved = meta ? averageSalary >= meta.targetAverageSalary : false

  return (
    <Card style={{ marginTop: 16 }}>
      <Title level={4} style={{ marginBottom: 16 }}>
        {meta ? `${meta.className}就业明细表` : '班级就业明细表'}
      </Title>

      {meta && (
        <Table
          bordered
          pagination={false}
          dataSource={[
            {
              key: 'summary',
              className: meta.className,
              totalRecords,
              requiredEmployment: meta.requiredEmployment,
              actualEmploymentCount,
              actualEmploymentRate: `${(actualEmploymentRate * 100).toFixed(0)}%`,
              actualHighEmploymentRate: `${(actualHighEmploymentRate * 100).toFixed(0)}%`,
              targetAverageSalary: meta.targetAverageSalary ? `¥${meta.targetAverageSalary}` : '-',
              averageSalary: averageSalary ? `¥${averageSalary}` : '-',
              employmentTargetRate: employmentTargetAchieved ? (
                <Tag color="purple">达标</Tag>
              ) : (
                <Tag color="orange">未达标</Tag>
              ),
              teacher: meta.teacher,
              counselor: meta.counselor,
            },
          ]}
          columns={[
            { title: '班级', dataIndex: 'className', align: 'center' },
            { title: '档案人数', dataIndex: 'totalRecords', align: 'center' },
            { title: '需就业人数', dataIndex: 'requiredEmployment', align: 'center' },
            { title: '实际就业人数', dataIndex: 'actualEmploymentCount', align: 'center' },
            { title: '实际就业率', dataIndex: 'actualEmploymentRate', align: 'center' },
            { title: '实际高就业率', dataIndex: 'actualHighEmploymentRate', align: 'center' },
            { title: '目标平均薪资', dataIndex: 'targetAverageSalary', align: 'center' },
            { title: '实际平均薪资', dataIndex: 'averageSalary', align: 'center' },
            { title: '就业达标率', dataIndex: 'employmentTargetRate', align: 'center' },
            { title: '教员', dataIndex: 'teacher', align: 'center' },
            { title: '班主任', dataIndex: 'counselor', align: 'center' },
          ]}
          size="small"
          style={{ marginBottom: 16 }}
        />
      )}

      <Table<StudentEmploymentDetail>
        bordered
        rowKey="key"
        columns={COLUMNS}
        dataSource={dataSource}
        pagination={false}
        scroll={{ x: 2200 }}
        size="small"
      />
    </Card>
  )
}, (prevProps, nextProps) => {
  // 自定义比较函数：仅在 classId 变化时重渲染
  return prevProps.classId === nextProps.classId
})

ClassEmploymentDetailTable.displayName = 'ClassEmploymentDetailTable'

export default ClassEmploymentDetailTable
