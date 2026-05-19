/**
 * 神殿教化司核心数据汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import type { CampusCoreDataTableProps, CampusCoreDataRecord } from '@/types/campus-core-data'
import { campusCoreDataService } from '@/services/teaching-quality/campusCoreData'

const CampusCoreDataTable: React.FC<CampusCoreDataTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
}) => {
  const { message } = App.useApp()
  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await campusCoreDataService.exportCampusCoreData(campus)
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

  const columns: ColumnsType<CampusCoreDataRecord> = [
    {
      title: '序号',
      dataIndex: 'key',
      key: 'key',
      width: 80,
      fixed: 'left',
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      fixed: 'left',
    },
    {
      title: '学生总人数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 120,
      render: (value) => value || 0,
    },
    {
      title: '班级总个数',
      dataIndex: 'totalClasses',
      key: 'totalClasses',
      width: 120,
      render: (value) => value || 0,
    },
    {
      title: '教质总职数',
      dataIndex: 'qualityStaffCount',
      key: 'qualityStaffCount',
      width: 120,
      render: (value) => value || 0,
    },
    {
      title: '干部总职数',
      dataIndex: 'cadreStaffCount',
      key: 'cadreStaffCount',
      width: 120,
      render: (value) => value || 0,
    },
    {
      title: '员工总人数',
      dataIndex: 'totalEmployees',
      key: 'totalEmployees',
      width: 120,
      render: (value) => value || 0,
    },
    {
      title: '就业班级总数',
      dataIndex: 'employmentClassCount',
      key: 'employmentClassCount',
      width: 140,
      render: (value) => value || 0,
    },
    {
      title: '就业总人数',
      dataIndex: 'totalEmployed',
      key: 'totalEmployed',
      width: 120,
      render: (value) => value || 0,
    },
    {
      title: '就业率',
      dataIndex: 'employmentRate',
      key: 'employmentRate',
      width: 100,
      render: (value) => (value ? `${value}%` : '0%'),
    },
    {
      title: '就业平均薪资',
      dataIndex: 'averageSalary',
      key: 'averageSalary',
      width: 140,
      render: (value) => (value ? `¥${value.toLocaleString()}` : '¥0'),
    },
    {
      title: '薪资过万人数',
      dataIndex: 'highSalaryCount',
      key: 'highSalaryCount',
      width: 140,
      render: (value) => value || 0,
    },
    {
      title: '企业签约总数',
      dataIndex: 'enterpriseContracts',
      key: 'enterpriseContracts',
      width: 140,
      render: (value) => value || 0,
    },
    {
      title: '口碑报名总人数',
      dataIndex: 'reputationRegistrations',
      key: 'reputationRegistrations',
      width: 140,
      render: (value) => value || 0,
    },
    {
      title: '口碑总收入',
      dataIndex: 'reputationRevenue',
      key: 'reputationRevenue',
      width: 140,
      render: (value) => (value ? `¥${value.toLocaleString()}` : '¥0'),
    },
    {
      title: '升学总人数',
      dataIndex: 'furtherEducationCount',
      key: 'furtherEducationCount',
      width: 120,
      render: (value) => value || 0,
    },
    {
      title: '升学总收入',
      dataIndex: 'furtherEducationRevenue',
      key: 'furtherEducationRevenue',
      width: 140,
      render: (value) => (value ? `¥${value.toLocaleString()}` : '¥0'),
    },
    {
      title: '升学率（金额）',
      dataIndex: 'furtherEducationRate',
      key: 'furtherEducationRate',
      width: 140,
      render: (value) => (value ? `${value}%` : '0%'),
    },
    {
      title: '新生入学总人数',
      dataIndex: 'newStudentEnrollments',
      key: 'newStudentEnrollments',
      width: 140,
      render: (value) => value || 0,
    },
    {
      title: '新生退费总人数',
      dataIndex: 'newStudentRefunds',
      key: 'newStudentRefunds',
      width: 140,
      render: (value) => value || 0,
    },
    {
      title: '老生退费总人数',
      dataIndex: 'oldStudentRefunds',
      key: 'oldStudentRefunds',
      width: 140,
      render: (value) => value || 0,
    },
    {
      title: '退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 100,
      render: (value) => (value ? `${value}%` : '0%'),
    },
    {
      title: '异动率',
      dataIndex: 'fluctuationRate',
      key: 'fluctuationRate',
      width: 100,
      render: (value) => (value ? `${value}%` : '0%'),
    },
    {
      title: '宿舍总个数',
      dataIndex: 'totalDormitories',
      key: 'totalDormitories',
      width: 120,
      render: (value) => value || 0,
    },
    {
      title: '宿舍总人数',
      dataIndex: 'totalDormitoryOccupancy',
      key: 'totalDormitoryOccupancy',
      width: 120,
      render: (value) => value || 0,
    },
    {
      title: '中专层次目标注册总人数',
      dataIndex: 'secondaryVocationalTarget',
      key: 'secondaryVocationalTarget',
      width: 180,
      render: (value) => value || 0,
    },
    {
      title: '大学层次目标注册总人数',
      dataIndex: 'universityTarget',
      key: 'universityTarget',
      width: 180,
      render: (value) => value || 0,
    },
  ]

  return (
    <Card
      title={`${campus || '请选择神殿'}教化司核心数据汇总表`}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            刷新
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={!campus || !data}>
            导出
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={data ? [data] : []}
        loading={loading}
        pagination={false}
        bordered
        scroll={{ x: 'max-content' }}
        rowKey="key"
        size="small"
      />
    </Card>
  )
}

export default CampusCoreDataTable
