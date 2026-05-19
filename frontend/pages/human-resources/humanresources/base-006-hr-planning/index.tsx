import React, { useCallback, useEffect, useState } from 'react'
import { App, Tabs, Card, Result } from 'antd'
import {
  FileTextOutlined,
  FormOutlined,
  AuditOutlined,
  TeamOutlined,
  SwapOutlined,
  PauseCircleOutlined,
  InteractionOutlined,
  LogoutOutlined,
  SolutionOutlined,
} from '@ant-design/icons'
import WorkReport from './WorkReport'
import RegularizationApplication from './RegularizationApplication'
import PromotionApplication from './PromotionApplication'
import PromotionInterview from './PromotionInterview'
import AppointmentInterviewRecord from './AppointmentInterviewRecord'
import TransferApplication from './TransferApplication'
import UnpaidLeaveApplication from './UnpaidLeaveApplication'
import WorkHandover from './WorkHandover'
import ResignationApproval from './ResignationApproval'
import { workReportApi, type WorkReportStatus } from '@/services/humanresources/workReport'
import { useAuthStore } from '@/stores/authStore'

/**
 * 006 集团人资基础-人力资源规划
 * 最高议事厅 -> 人事部 -> 基础数据
 * 路由: /humanresources/base/hr-planning
 *
 * 包含9个TAB:
 * 1. 述职报告
 * 2. 转正申请表
 * 3. 晋升申请表
 * 4. 晋升面试表
 * 5. 任命访谈记录表
 * 6. 调岗申请表
 * 7. 停薪留职申请表
 * 8. 工作交接表
 * 9. 离职审批单
 */

const PlaceholderTab: React.FC<{ title: string }> = ({ title }) => (
  <Card>
    <Result
      icon={<FormOutlined />}
      title={title}
      subTitle="页面开发中..."
    />
  </Card>
)

const EMPTY_WORK_REPORT_STATUS: WorkReportStatus = {
  hasCompletedReport: false,
  latestReportId: null,
  latestReportDate: null,
}

const HrPlanning: React.FC = () => {
  const { message } = App.useApp()
  const currentUser = useAuthStore((state) => state.user)
  const [workReportStatusLoading, setWorkReportStatusLoading] = useState(false)
  const [workReportStatus, setWorkReportStatus] = useState<WorkReportStatus>(EMPTY_WORK_REPORT_STATUS)

  const loadWorkReportStatus = useCallback(async () => {
    if (!currentUser) {
      setWorkReportStatus(EMPTY_WORK_REPORT_STATUS)
      return
    }
    try {
      setWorkReportStatusLoading(true)
      const data = await workReportApi.getMyStatus()
      setWorkReportStatus(data)
    } catch (error) {
      console.error('加载述职报告状态失败', error)
      message.error('加载述职报告状态失败')
    } finally {
      setWorkReportStatusLoading(false)
    }
  }, [currentUser, message])

  useEffect(() => {
    void loadWorkReportStatus()
  }, [loadWorkReportStatus])

  const tabItems = [
    {
      key: 'work-report',
      label: <span><FileTextOutlined /> 述职报告</span>,
      children: <WorkReport onWorkReportChanged={loadWorkReportStatus} />,
    },
    {
      key: 'regularization-application',
      label: <span><AuditOutlined /> 转正申请表</span>,
      children: (
        <RegularizationApplication
          workReportStatus={workReportStatus}
          workReportStatusLoading={workReportStatusLoading}
        />
      ),
    },
    {
      key: 'promotion-application',
      label: <span><FormOutlined /> 晋升申请表</span>,
      children: <PromotionApplication />,
    },
    {
      key: 'promotion-interview',
      label: <span><TeamOutlined /> 晋升面试表</span>,
      children: <PromotionInterview />,
    },
    {
      key: 'appointment-interview-record',
      label: <span><SolutionOutlined /> 任命访谈记录表</span>,
      children: <AppointmentInterviewRecord />,
    },
    {
      key: 'transfer-application',
      label: <span><SwapOutlined /> 调岗申请表</span>,
      children: <TransferApplication />,
    },
    {
      key: 'unpaid-leave-application',
      label: <span><PauseCircleOutlined /> 停薪留职申请表</span>,
      children: <UnpaidLeaveApplication />,
    },
    {
      key: 'work-handover',
      label: <span><InteractionOutlined /> 工作交接表</span>,
      children: <WorkHandover />,
    },
    {
      key: 'resignation-approval',
      label: <span><LogoutOutlined /> 离职审批单</span>,
      children: <ResignationApproval />,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Tabs
        defaultActiveKey="work-report"
        type="card"
        size="large"
        items={tabItems}
      />
    </div>
  )
}

export default HrPlanning
