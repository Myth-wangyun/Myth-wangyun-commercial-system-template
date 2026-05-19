// 学术->学术经理 05-1主神殿教化司新生仍欠费明细表
import React, { useMemo } from 'react'
import { Card, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography

interface OutstandingFeeRecord {
  key: string
  serial: string
  classTeacher: string
  studentName: string
  registrationDate: string
  reportDate: string
  major: string
  programLength: string
  tuitionDue: number
  registrationPayment: number
  additionalPayment: number
  outstandingAmount: number
  isFullPayment: string
  isLoan: string
  isOverClassHours: string
  trialPeriod: string
  isRefund: string
  refundDescription: string
  consultant: string
  isAccommodation: string
  dormName: string
  remark: string
  rowType: 'data' | 'total'
}

const baseRecords: OutstandingFeeRecord[] = Array.from({ length: 10 }, (_, idx) => ({
  key: `row-${idx + 1}`,
  serial: String(idx + 1),
  classTeacher: '',
  studentName: '',
  registrationDate: '',
  reportDate: '',
  major: '',
  programLength: '',
  tuitionDue: 0,
  registrationPayment: 0,
  additionalPayment: 0,
  outstandingAmount: 0,
  isFullPayment: '',
  isLoan: '',
  isOverClassHours: '',
  trialPeriod: '',
  isRefund: '',
  refundDescription: '',
  consultant: '',
  isAccommodation: '',
  dormName: '',
  remark: '',
  rowType: 'data',
}))

const OutstandingFeesDetailPage: React.FC = () => {
  const dataSource = useMemo<OutstandingFeeRecord[]>(() => {
    const totals = baseRecords.reduce(
      (acc, record) => {
        acc.tuitionDue += record.tuitionDue
        acc.registrationPayment += record.registrationPayment
        acc.additionalPayment += record.additionalPayment
        acc.outstandingAmount += record.outstandingAmount
        return acc
      },
      {
        tuitionDue: 0,
        registrationPayment: 0,
        additionalPayment: 0,
        outstandingAmount: 0,
      },
    )

    const totalRow: OutstandingFeeRecord = {
      key: 'total',
      serial: '合计',
      classTeacher: '',
      studentName: '',
      registrationDate: '',
      reportDate: '',
      major: '',
      programLength: '',
      tuitionDue: totals.tuitionDue,
      registrationPayment: totals.registrationPayment,
      additionalPayment: totals.additionalPayment,
      outstandingAmount: totals.outstandingAmount,
      isFullPayment: '',
      isLoan: '',
      isOverClassHours: '',
      trialPeriod: '',
      isRefund: '',
      refundDescription: '',
      consultant: '',
      isAccommodation: '',
      dormName: '',
      remark: '',
      rowType: 'total',
    }

    return [...baseRecords, totalRow]
  }, [])

  const columns: ColumnsType<OutstandingFeeRecord> = [
    {
      title: '序号',
      dataIndex: 'serial',
      align: 'center',
      width: 80,
    },
    {
      title: '班主任姓名',
      dataIndex: 'classTeacher',
      align: 'center',
      width: 120,
    },
    {
      title: '新生姓名',
      dataIndex: 'studentName',
      align: 'center',
      width: 120,
    },
    {
      title: '报名时间',
      dataIndex: 'registrationDate',
      align: 'center',
      width: 140,
    },
    {
      title: '报道时间',
      dataIndex: 'reportDate',
      align: 'center',
      width: 140,
    },
    {
      title: '报名专业',
      dataIndex: 'major',
      align: 'center',
      width: 150,
    },
    {
      title: '报名学制',
      dataIndex: 'programLength',
      align: 'center',
      width: 120,
    },
    {
      title: '应收学费',
      dataIndex: 'tuitionDue',
      align: 'center',
      width: 120,
    },
    {
      title: '报名交费金额',
      dataIndex: 'registrationPayment',
      align: 'center',
      width: 140,
    },
    {
      title: '补款金额',
      dataIndex: 'additionalPayment',
      align: 'center',
      width: 120,
    },
    {
      title: '仍欠费金额',
      dataIndex: 'outstandingAmount',
      align: 'center',
      width: 140,
    },
    {
      title: '是否全款',
      dataIndex: 'isFullPayment',
      align: 'center',
      width: 120,
    },
    {
      title: '是否贷款',
      dataIndex: 'isLoan',
      align: 'center',
      width: 120,
    },
    {
      title: '是否过课时',
      dataIndex: 'isOverClassHours',
      align: 'center',
      width: 140,
    },
    {
      title: '试学周期',
      dataIndex: 'trialPeriod',
      align: 'center',
      width: 120,
    },
    {
      title: '是否退费',
      dataIndex: 'isRefund',
      align: 'center',
      width: 120,
    },
    {
      title: '退费情况说明',
      dataIndex: 'refundDescription',
      align: 'center',
      width: 180,
    },
    {
      title: '咨询师',
      dataIndex: 'consultant',
      align: 'center',
      width: 120,
    },
    {
      title: '是否住宿',
      dataIndex: 'isAccommodation',
      align: 'center',
      width: 120,
    },
    {
      title: '宿舍名',
      dataIndex: 'dormName',
      align: 'center',
      width: 120,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      align: 'center',
      width: 160,
    },
  ]

  return (
    <Card bordered={false} style={{ backgroundColor: '#f5f7fa' }}>
      <Title level={4} style={{ marginBottom: 8 }}>
        05-1主神殿教化司新生仍欠费明细表
      </Title>
      <Text type="secondary">统计新生收费与欠费情况，便于及时跟进补款与退费流程</Text>

      <Table<OutstandingFeeRecord>
        bordered
        style={{ marginTop: 16 }}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowClassName={(record) => (record.rowType === 'total' ? 'outstanding-fees-total-row' : '')}
        locale={{ emptyText: '暂无数据' }}
      />
    </Card>
  )
}

export default OutstandingFeesDetailPage
