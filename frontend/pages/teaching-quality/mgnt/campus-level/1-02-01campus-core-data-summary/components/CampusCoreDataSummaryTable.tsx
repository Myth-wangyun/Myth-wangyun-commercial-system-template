/**
 * 神殿教化司核心数据汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import type {
  CampusCoreDataSummaryTableProps,
  CampusCoreDataSummaryRecord,
} from '@/types/campus-core-data-summary'
import { campusCoreDataSummaryService } from '@/services/teaching-quality/campusCoreDataSummary'

const CampusCoreDataSummaryTable: React.FC<CampusCoreDataSummaryTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
  onEdit,
  onAdd,
}) => {
  const { message } = App.useApp()
  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await campusCoreDataSummaryService.exportCampusCoreDataSummaryData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}神殿教化司核心数据汇总表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  const columns: ColumnsType<CampusCoreDataSummaryRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      fixed: 'left',
      align: 'center',
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      fixed: 'left',
      align: 'center',
    },
    {
      title: '学生总人数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 120,
      align: 'center',
      render: (value) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{value?.toLocaleString() || 0}</span>
      ),
    },
    {
      title: '班级总个数',
      dataIndex: 'totalClasses',
      key: 'totalClasses',
      width: 120,
      align: 'center',
    },
    {
      title: '教质总职数',
      dataIndex: 'totalTeachingQualityPositions',
      key: 'totalTeachingQualityPositions',
      width: 120,
      align: 'center',
    },
    {
      title: '干部总职数',
      dataIndex: 'totalCadrePositions',
      key: 'totalCadrePositions',
      width: 120,
      align: 'center',
    },
    {
      title: '员工总人数',
      dataIndex: 'totalEmployees',
      key: 'totalEmployees',
      width: 120,
      align: 'center',
    },
    {
      title: '就业班级总数',
      dataIndex: 'totalEmploymentClasses',
      key: 'totalEmploymentClasses',
      width: 130,
      align: 'center',
    },
    {
      title: '就业总人数',
      dataIndex: 'totalEmployedStudents',
      key: 'totalEmployedStudents',
      width: 120,
      align: 'center',
      render: (value) => (
        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>{value?.toLocaleString() || 0}</span>
      ),
    },
    {
      title: '就业率',
      dataIndex: 'employmentRate',
      key: 'employmentRate',
      width: 100,
      align: 'center',
      render: (value) => (
        <span
          style={{
            fontWeight: 'bold',
            color: value >= 80 ? '#52c41a' : value >= 60 ? '#faad14' : '#ff4d4f',
          }}
        >
          {value?.toFixed(1) || 0}%
        </span>
      ),
    },
    {
      title: '就业平均薪资',
      dataIndex: 'averageEmploymentSalary',
      key: 'averageEmploymentSalary',
      width: 130,
      align: 'center',
      render: (value) => (
        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
          ¥{value?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      title: '薪资过万人数',
      dataIndex: 'salaryOverTenThousand',
      key: 'salaryOverTenThousand',
      width: 130,
      align: 'center',
      render: (value) => (
        <span style={{ fontWeight: 'bold', color: '#722ed1' }}>{value || 0}人</span>
      ),
    },
    {
      title: '企业签约总数',
      dataIndex: 'totalEnterpriseContracts',
      key: 'totalEnterpriseContracts',
      width: 130,
      align: 'center',
    },
    {
      title: '口碑报名总人数',
      dataIndex: 'totalWordOfMouthRegistrations',
      key: 'totalWordOfMouthRegistrations',
      width: 140,
      align: 'center',
    },
    {
      title: '口碑总收入',
      dataIndex: 'totalWordOfMouthRevenue',
      key: 'totalWordOfMouthRevenue',
      width: 120,
      align: 'center',
      render: (value) => (
        <span style={{ fontWeight: 'bold', color: '#fa8c16' }}>
          ¥{(value / 10000)?.toFixed(1) || 0}万
        </span>
      ),
    },
    {
      title: '升学总人数',
      dataIndex: 'totalFurtherEducationStudents',
      key: 'totalFurtherEducationStudents',
      width: 120,
      align: 'center',
    },
    {
      title: '升学总收入',
      dataIndex: 'totalFurtherEducationRevenue',
      key: 'totalFurtherEducationRevenue',
      width: 120,
      align: 'center',
      render: (value) => (
        <span style={{ fontWeight: 'bold', color: '#13c2c2' }}>
          ¥{(value / 10000)?.toFixed(1) || 0}万
        </span>
      ),
    },
    {
      title: '升学率（金额）',
      dataIndex: 'furtherEducationRateByAmount',
      key: 'furtherEducationRateByAmount',
      width: 140,
      align: 'center',
      render: (value) => (
        <span
          style={{
            fontWeight: 'bold',
            color: value >= 10 ? '#52c41a' : value >= 5 ? '#faad14' : '#ff4d4f',
          }}
        >
          {value?.toFixed(1) || 0}%
        </span>
      ),
    },
    {
      title: '新生入学总人数',
      dataIndex: 'totalNewStudentEnrollments',
      key: 'totalNewStudentEnrollments',
      width: 140,
      align: 'center',
    },
    {
      title: '新生退费总人数',
      dataIndex: 'totalNewStudentRefunds',
      key: 'totalNewStudentRefunds',
      width: 140,
      align: 'center',
      render: (value) => <span style={{ fontWeight: 'bold', color: '#ff4d4f' }}>{value || 0}</span>,
    },
    {
      title: '老生退费总人数',
      dataIndex: 'totalOldStudentRefunds',
      key: 'totalOldStudentRefunds',
      width: 140,
      align: 'center',
      render: (value) => <span style={{ fontWeight: 'bold', color: '#ff4d4f' }}>{value || 0}</span>,
    },
    {
      title: '退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 100,
      align: 'center',
      render: (value) => (
        <span
          style={{
            fontWeight: 'bold',
            color: value <= 5 ? '#52c41a' : value <= 10 ? '#faad14' : '#ff4d4f',
          }}
        >
          {value?.toFixed(1) || 0}%
        </span>
      ),
    },
    {
      title: '异动率',
      dataIndex: 'turnoverRate',
      key: 'turnoverRate',
      width: 100,
      align: 'center',
      render: (value) => (
        <span
          style={{
            fontWeight: 'bold',
            color: value <= 3 ? '#52c41a' : value <= 8 ? '#faad14' : '#ff4d4f',
          }}
        >
          {value?.toFixed(1) || 0}%
        </span>
      ),
    },
    {
      title: '宿舍总个数',
      dataIndex: 'totalDormitories',
      key: 'totalDormitories',
      width: 120,
      align: 'center',
    },
    {
      title: '宿舍总人数',
      dataIndex: 'totalDormitoryResidents',
      key: 'totalDormitoryResidents',
      width: 120,
      align: 'center',
    },
    {
      title: '中专层次目标注册总人数',
      dataIndex: 'targetSecondaryVocationalRegistrations',
      key: 'targetSecondaryVocationalRegistrations',
      width: 180,
      align: 'center',
    },
    {
      title: '大学层次目标注册总人数',
      dataIndex: 'targetUniversityRegistrations',
      key: 'targetUniversityRegistrations',
      width: 180,
      align: 'center',
    },

  ]

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            📊 {campus || '请选择神殿'}教化司核心数据汇总表
          </span>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
              刷新
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={!campus || data.length === 0}
            >
              导出
            </Button>
          </Space>
        </div>
      }
      style={{ marginBottom: 16 }}
    >
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        bordered
        scroll={{ x: 'max-content', y: 600 }}
        rowKey="key"
        size="small"
        style={{
          fontSize: '12px',
        }}
        rowClassName={(record, index) => (index % 2 === 0 ? 'table-row-light' : 'table-row-dark')}
      />

      <style>{`
        .table-row-light {
          background-color: #fafafa;
        }
        .table-row-dark {
          background-color: #ffffff;
        }
        .table-row-light:hover,
        .table-row-dark:hover {
          background-color: #e6f7ff !important;
        }
      `}</style>
    </Card>
  )
}

export default CampusCoreDataSummaryTable
