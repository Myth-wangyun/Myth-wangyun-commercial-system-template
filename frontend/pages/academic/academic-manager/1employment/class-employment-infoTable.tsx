import React from 'react'
import { Card, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

interface EmploymentRecord {
  key: string
  serialNumber: number
  name: string
  gender: '男' | '女'
  age: string
  major: string
  education: string
  phone: string
  onboardingDate: string
  employmentRegion: string
  company: string
  position: string
  salary: string
  salaryAmount: number
  followUp: string
  followUpSalaryAmount: number
}

const EMPLOYMENT_DATA: EmploymentRecord[] = [
  {
    key: '1',
    serialNumber: 1,
    name: '康豪泽',
    gender: '男',
    age: '19岁',
    major: '云计算',
    education: '初中',
    phone: '15075208287',
    onboardingDate: '2024.6.20',
    employmentRegion: '北京',
    company: '北京首佳利华科技有限公司',
    position: '网络工程师',
    salary: '6000底薪+饭补200+话补100+五险一金+双休',
    salaryAmount: 6300,
    followUp: '情况属实，无变化',
    followUpSalaryAmount: 6300,
  },
  {
    key: '2',
    serialNumber: 2,
    name: '刘安阳',
    gender: '男',
    age: '20岁',
    major: '云计算',
    education: '初中',
    phone: '13683510621',
    onboardingDate: '2024.6.26',
    employmentRegion: '北京',
    company: '北京晟途影文化传媒有限公司',
    position: '桌面运维工程师',
    salary: '6000+五险一金+岗位津贴+绩效工资+工龄奖+餐补+交通补助',
    salaryAmount: 6000,
    followUp: '情况属实，无变化',
    followUpSalaryAmount: 6000,
  },
  {
    key: '3',
    serialNumber: 3,
    name: '李佳龙',
    gender: '男',
    age: '18岁',
    major: '云计算',
    education: '初中',
    phone: '18732197815',
    onboardingDate: '2024.6.26',
    employmentRegion: '上海',
    company: '上海兴格信息科技有限公司',
    position: '网络工程师',
    salary: '7000-9000+五险一金+工作时间自由，最低保薪7K',
    salaryAmount: 7000,
    followUp: '情况属实，无变化',
    followUpSalaryAmount: 7000,
  },
  {
    key: '4',
    serialNumber: 4,
    name: '张浩程',
    gender: '男',
    age: '19岁',
    major: '云计算',
    education: '初中',
    phone: '15531025164',
    onboardingDate: '2024.7.1',
    employmentRegion: '北京',
    company: '北京识音智能科技有限公司',
    position: '网络工程师',
    salary: '7000+五险一金+上一休二+法定节假日三薪',
    salaryAmount: 7000,
    followUp: '情况属实，无变化',
    followUpSalaryAmount: 7000,
  },
  {
    key: '5',
    serialNumber: 5,
    name: '胡铭阳',
    gender: '男',
    age: '18岁',
    major: '云计算',
    education: '初中',
    phone: '17325621286',
    onboardingDate: '2024.7.2',
    employmentRegion: '北京',
    company: '上海云辰科技有限公司',
    position: '网络工程师',
    salary: '6500底薪+300餐补+100通讯补助+五险一金',
    salaryAmount: 6900,
    followUp: '情况属实，无变化',
    followUpSalaryAmount: 6900,
  },
  {
    key: '6',
    serialNumber: 6,
    name: '李明哲',
    gender: '男',
    age: '22岁',
    major: '云计算',
    education: '中专',
    phone: '17521660751',
    onboardingDate: '2024.7.8',
    employmentRegion: '上海',
    company: '上海蜚茂信息科技有限公司',
    position: '网络工程师',
    salary: '6500+餐补600+项目提成+五险一金+法定节假日带薪休假+周末双休',
    salaryAmount: 7100,
    followUp: '情况属实，无变化',
    followUpSalaryAmount: 7100,
  },
  {
    key: '7',
    serialNumber: 7,
    name: '闫帅丞',
    gender: '男',
    age: '19岁',
    major: '云计算',
    education: '初中',
    phone: '15032702296',
    onboardingDate: '2024.7.3',
    employmentRegion: '上海',
    company: '上海众频网络系统工程有限公司',
    position: '网络工程师',
    salary: '5500底薪+500加班补助+1000住房补贴+项目提成',
    salaryAmount: 7000,
    followUp: '情况属实，无变化',
    followUpSalaryAmount: 7000,
  },
  {
    key: '8',
    serialNumber: 8,
    name: '王硕',
    gender: '男',
    age: '20岁',
    major: '云计算',
    education: '中专',
    phone: '15733119290',
    onboardingDate: '2024.7.8',
    employmentRegion: '北京',
    company: '北京卓尔立锐科技有限公司',
    position: '网络工程师',
    salary: '8000底薪+五险一金+双休+住房补贴1000',
    salaryAmount: 9000,
    followUp: '情况属实，无变化',
    followUpSalaryAmount: 9000,
  },
  {
    key: '9',
    serialNumber: 9,
    name: '尹烁康',
    gender: '男',
    age: '20岁',
    major: '云计算',
    education: '中专',
    phone: '18348925801',
    onboardingDate: '2024.7.11',
    employmentRegion: '上海',
    company: '上海可利邦信息技术有限公司',
    position: '运维工程师',
    salary: '7500+500补助（饭补+全勤）+五险一金+双休',
    salaryAmount: 8000,
    followUp: '情况属实，无变化',
    followUpSalaryAmount: 8000,
  },
  {
    key: '10',
    serialNumber: 10,
    name: '齐少航',
    gender: '男',
    age: '19岁',
    major: '云计算',
    education: '初中',
    phone: '15674977039',
    onboardingDate: '2024.7.15',
    employmentRegion: '北京',
    company: '北京观泰天聚科技有限公司',
    position: '运维工程师',
    salary: '底薪6500+660（饭补每天30）+1000（住房补贴）+五险一金+双休+出差补助（每天300）',
    salaryAmount: 8160,
    followUp: '转正：6500底薪+700饭补+1000住宿',
    followUpSalaryAmount: 8200,
  },
  {
    key: '11',
    serialNumber: 11,
    name: '王亚雄',
    gender: '男',
    age: '18岁',
    major: '云计算',
    education: '初中',
    phone: '15232093159',
    onboardingDate: '2024.7.24',
    employmentRegion: '北京',
    company: '北京昊悦万家生物科技有限公司',
    position: '售后工程师',
    salary: '5000+双休+五险一金',
    salaryAmount: 5000,
    followUp: '薪资5500+双休+五险一金',
    followUpSalaryAmount: 5500,
  },
  {
    key: '12',
    serialNumber: 12,
    name: '孙金泽',
    gender: '男',
    age: '19岁',
    major: '云计算',
    education: '初中',
    phone: '18633090206',
    onboardingDate: '2024.7.25',
    employmentRegion: '北京',
    company: '北京锦程前方科技有限公司',
    position: '网络工程师',
    salary: '7000+绩效+房补+五险一金综合薪资',
    salaryAmount: 7000,
    followUp: '情况属实，无变化',
    followUpSalaryAmount: 7000,
  },
  {
    key: '13',
    serialNumber: 13,
    name: '李少雄',
    gender: '男',
    age: '19岁',
    major: '云计算',
    education: '初中',
    phone: '18931086146',
    onboardingDate: '2024.8.1',
    employmentRegion: '北京',
    company: '北京慧美丽科技发展有限公司',
    position: '运维工程师',
    salary: '7000+1000住房+1000餐补+双休+五险一金',
    salaryAmount: 8000,
    followUp: '修改：底薪6200+1000住房+1000餐补+双休+五险',
    followUpSalaryAmount: 8200,
  },
]

const columns: ColumnsType<EmploymentRecord> = [
  {
    title: '序号',
    dataIndex: 'serialNumber',
    key: 'serialNumber',
    width: 70,
    align: 'center',
  },
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    width: 100,
    align: 'center',
  },
  {
    title: '性别',
    dataIndex: 'gender',
    key: 'gender',
    width: 70,
    align: 'center',
  },
  {
    title: '年龄',
    dataIndex: 'age',
    key: 'age',
    width: 80,
    align: 'center',
  },
  {
    title: '所报专业',
    dataIndex: 'major',
    key: 'major',
    width: 100,
    align: 'center',
  },
  {
    title: '学历',
    dataIndex: 'education',
    key: 'education',
    width: 90,
    align: 'center',
  },
  {
    title: '联系电话',
    dataIndex: 'phone',
    key: 'phone',
    width: 130,
    align: 'center',
  },
  {
    title: '入职时间',
    dataIndex: 'onboardingDate',
    key: 'onboardingDate',
    width: 110,
    align: 'center',
  },
  {
    title: '就业地区',
    dataIndex: 'employmentRegion',
    key: 'employmentRegion',
    width: 100,
    align: 'center',
  },
  {
    title: '就业单位',
    dataIndex: 'company',
    key: 'company',
    width: 220,
    align: 'left',
  },
  {
    title: '就业岗位',
    dataIndex: 'position',
    key: 'position',
    width: 160,
    align: 'left',
  },
  {
    title: '转正薪资',
    dataIndex: 'salary',
    key: 'salary',
    width: 260,
    align: 'left',
  },
  {
    title: '转正金额',
    dataIndex: 'salaryAmount',
    key: 'salaryAmount',
    width: 110,
    align: 'center',
    render: (amount) => amount.toLocaleString(),
  },
  {
    title: '回访情况入职公司',
    dataIndex: 'followUp',
    key: 'followUp',
    width: 220,
    align: 'left',
  },
  {
    title: '回访转正金额',
    dataIndex: 'followUpSalaryAmount',
    key: 'followUpSalaryAmount',
    width: 130,
    align: 'center',
    render: (amount) => amount.toLocaleString(),
  },
]

const ClassEmploymentInfoTable: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 16 }}>
          学术经理班级就业信息明细表
        </Title>
        <Table
          bordered
          size="small"
          columns={columns}
          dataSource={EMPLOYMENT_DATA}
          pagination={false}
          scroll={{ x: 1600 }}
        />
      </Card>
    </div>
  )
}

export default ClassEmploymentInfoTable
