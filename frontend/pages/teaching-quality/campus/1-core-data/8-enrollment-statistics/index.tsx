import React, { useEffect } from 'react'
import { Card, Tabs } from 'antd'
import { BookOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'

import CampusEnrollmentStatisticsAllPage from './0-campus-enrollment-statistics-summary'
import Secondary3YearRegistrationRoster from './1-secondary-3year-registration-roster'
import Secondary1YearRegistrationRoster from './2-secondary-1year-registration-roster'
import OtherSecondaryEducationRegistrationRoster from './3-other-secondary-education-registration-roster'
import AdultExamRegistrationRoster from './4-adult-exam-registration-roster'
import OpenUniversityRegistrationRoster from './5-open-university-registration-roster'
import OtherHigherEducationRegistrationRoster from './6-other-higher-education-registration'
import Secondary3YearToRegisterRoster from './7-secondary-3year-to-register-roster'
import Secondary1YearToRegisterRoster from './8-secondary-1year-to-register-roster'
import OtherSecondaryEducationToRegisterRoster from './9-other-secondary-education-to-register-roster'
import AdultExamToRegisterRoster from './10-adult-exam-to-register-roster'
import OpenUniversityToRegisterRoster from './11-open-university-to-register-roster'
import OtherHigherEducationToRegisterRoster from './12-other-higher-education-to-register-roster'

const CampusEnrollmentStatisticsTabsPage: React.FC = () => {
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()

  useEffect(() => {
    if (!currentCampus && campuses.length > 0) {
      setCampus(campuses[0].name)
    }
  }, [currentCampus, campuses, setCampus])

  if (!currentCampus) {
    return null
  }

  return (
    <div
      style={{
        padding: 24,
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Card style={{ marginBottom: 24, backgroundColor: '#fff' }}>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <BookOutlined style={{ marginRight: 8 }} />
          {currentCampus} · 学籍统计
        </h1>
      </Card>

      <Tabs
        className="campus-enrollment-tabs"
        defaultActiveKey="summary"
        type="card"
        items={[
          {
            key: 'summary',
            label: '教化司学籍统计表',
            children: <CampusEnrollmentStatisticsAllPage />,
          },
          {
            key: 'secondary',
            label: '📚 中专层次',
            children: (
              <div style={{ background: '#fff', padding: '16px', borderRadius: '8px' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  color: '#fff', 
                  padding: '12px 20px', 
                  borderRadius: '6px', 
                  marginBottom: '16px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  📚 中专层次学籍管理
                </div>
                <Tabs
                  type="card"
                  defaultActiveKey="secondary-3year-registration"
                  items={[
                    {
                      key: 'secondary-3year-registration',
                      label: '中专3年学籍注册花名册',
                      children: <Secondary3YearRegistrationRoster />,
                    },
                    {
                      key: 'secondary-1year-registration',
                      label: '中专1年制注册花名册',
                      children: <Secondary1YearRegistrationRoster />,
                    },
                    {
                      key: 'other-secondary-registration',
                      label: '其他中等教育注册花名册',
                      children: <OtherSecondaryEducationRegistrationRoster />,
                    },
                    {
                      key: 'secondary-3year-to-register',
                      label: '中专3年学籍需注册花名册',
                      children: <Secondary3YearToRegisterRoster />,
                    },
                    {
                      key: 'secondary-1year-to-register',
                      label: '中专1年制需注册花名册',
                      children: <Secondary1YearToRegisterRoster />,
                    },
                    {
                      key: 'other-secondary-to-register',
                      label: '其他中等教育需注册花名册',
                      children: <OtherSecondaryEducationToRegisterRoster />,
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'higher-education',
            label: '🎓 大学层次',
            children: (
              <div style={{ background: '#fff', padding: '16px', borderRadius: '8px' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
                  color: '#fff', 
                  padding: '12px 20px', 
                  borderRadius: '6px', 
                  marginBottom: '16px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  🎓 大学层次学籍管理
                </div>
                <Tabs
                  type="card"
                  defaultActiveKey="adult-exam-registration"
                  items={[
                    {
                      key: 'adult-exam-registration',
                      label: '成考学籍注册花名册',
                      children: <AdultExamRegistrationRoster />,
                    },
                    {
                      key: 'adult-exam-to-register',
                      label: '成考需注册花名册',
                      children: <AdultExamToRegisterRoster />,
                    },
                    {
                      key: 'open-university-registration',
                      label: '国开学籍注册花名册',
                      children: <OpenUniversityRegistrationRoster />,
                    },
                    {
                      key: 'open-university-to-register',
                      label: '国开学籍需注册花名册',
                      children: <OpenUniversityToRegisterRoster />,
                    },
                    {
                      key: 'other-higher-registration',
                      label: '其他高等教育学籍注册花名册',
                      children: <OtherHigherEducationRegistrationRoster />,
                    },
                    {
                      key: 'other-higher-to-register',
                      label: '其他高等教育学籍需注册花名册',
                      children: <OtherHigherEducationToRegisterRoster />,
                    },
                  ]}
                />
              </div>
            ),
          },
        ]}
      />

      <style>
        {`
          .campus-enrollment-tabs .ant-tabs-nav-wrap {
            white-space: normal;
          }
          .campus-enrollment-tabs .ant-tabs-nav-list {
            flex-wrap: wrap;
          }
          .campus-enrollment-tabs .ant-tabs-tab {
            padding: 8px 16px;
            margin-right: 8px;
            margin-bottom: 8px;
          }
          .campus-enrollment-tabs .ant-tabs-content-holder {
            background: #fff;
            padding: 16px;
            border-radius: 4px;
            margin-top: 16px;
          }
          .campus-enrollment-tabs .ant-tabs-tabpane {
            padding: 0;
          }
          /* 嵌套Tabs样式 */
          .campus-enrollment-tabs .ant-tabs .ant-tabs {
            margin-top: 0;
          }
          .campus-enrollment-tabs .ant-tabs .ant-tabs-nav {
            margin-bottom: 16px;
          }
          .campus-enrollment-tabs .ant-tabs .ant-tabs-tab {
            padding: 6px 14px;
            font-size: 14px;
          }
        `}
      </style>
    </div>
  )
}

export default CampusEnrollmentStatisticsTabsPage
