/**
 * 006 集团人资基础-招聘入职
 * 最高议事厅 -> 人事部 -> 基础数据
 * 路由: /humanresources/base/recruitment-onboarding
 *
 * 包含TAB:
 * 1. 招聘需求申请表
 * 2. 面试登记表（清美面试邀约及反馈表）
 */
import React from 'react'
import { Button, Result, Tabs } from 'antd'
import { SolutionOutlined, ContactsOutlined } from '@ant-design/icons'
import RecruitmentRequest from './RecruitmentRequest'
import InterviewRegistration from './InterviewRegistration'
import { useAuthStore } from '@/stores/authStore'
import { canAccessRecruitmentOnboarding } from '@/utils/recruitmentOnboardingAccess'

const RecruitmentOnboarding: React.FC = () => {
  const user = useAuthStore((state) => state.user)
  const permissions = useAuthStore((state) => state.permissions)

  const canAccess = canAccessRecruitmentOnboarding({
    campus: user?.campus,
    department: user?.department,
    position: user?.position,
    role: user?.role,
    isSuperuser: user?.is_superuser,
    permissions,
  })

  if (!canAccess) {
    return (
      <div style={{ padding: 24 }}>
        <Result
          status="403"
          title="403"
          subTitle="当前账号没有访问招聘需求申请表的权限，请联系管理员确认部门和职位配置。"
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              返回
            </Button>
          }
        />
      </div>
    )
  }

  const tabItems = [
    {
      key: 'recruitment-request',
      label: <span><SolutionOutlined /> 招聘需求申请表</span>,
      children: <RecruitmentRequest />,
    },
    {
      key: 'interview-registration',
      label: <span><ContactsOutlined /> 面试登记表</span>,
      children: <InterviewRegistration />,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Tabs
        defaultActiveKey="recruitment-request"
        type="card"
        size="large"
        items={tabItems}
      />
    </div>
  )
}

export default RecruitmentOnboarding
