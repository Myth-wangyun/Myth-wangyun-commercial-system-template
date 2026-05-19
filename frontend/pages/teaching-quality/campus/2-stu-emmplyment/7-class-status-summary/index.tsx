import React from 'react'
import { Card, Tabs } from 'antd'
import {
  ScheduleOutlined,
  CheckSquareOutlined,
  BookOutlined,
  TeamOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import AttendanceSheet from './1-AttendanceSheet'
import QualityTrainingSheet from './2-QualityTrainingSheet'
import CotExamScoreSheet from './3-CotExamScoreSheet'
import ClassMeetingStatusSheet from './4-ClassMeetingStatusSheet'
import ClassCommitteeMeetingStatusSheet from './5-ClassCommitteeMeetingStatusSheet'
import HomeworkSheet from './6-HomeworkSheet'
import ExamSheet from './7-ExamSheet'
import FeeReminderSheet from './8-FeeReminderSheet'
import EveningSelfStudyAttendanceSheet from './9-EveningSelfStudyAttendanceSheet'
import SelfStudyListSheet from './10-SelfStudyListSheet'
import SpeechSheet from './11-SpeechSheet'

const ClassStatusSummaryTabsPage: React.FC = () => {
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
          }}
        >
          <ScheduleOutlined style={{ marginRight: 8 }} />
          班级情况表
        </h1>
      </Card>

      <Tabs
        defaultActiveKey="attendance"
        items={[
          {
            key: 'attendance',
            label: (
              <>
                <CheckSquareOutlined style={{ marginRight: 4 }} />
                出勤表
              </>
            ),
            children: <AttendanceSheet />,
          },
          {
            key: 'quality-training',
            label: (
              <>
                <BookOutlined style={{ marginRight: 4 }} />
                素质训练登记表
              </>
            ),
            children: <QualityTrainingSheet />,
          },
          {
            key: 'cot-exam',
            label: (
              <>
                <FileTextOutlined style={{ marginRight: 4 }} />
                COT考试成绩表
              </>
            ),
            children: <CotExamScoreSheet />,
          },
          {
            key: 'class-meeting',
            label: (
              <>
                <TeamOutlined style={{ marginRight: 4 }} />
                班会情况表
              </>
            ),
            children: <ClassMeetingStatusSheet />,
          },
          {
            key: 'class-committee',
            label: (
              <>
                <TeamOutlined style={{ marginRight: 4 }} />
                班委会情况表
              </>
            ),
            children: <ClassCommitteeMeetingStatusSheet />,
          },
          {
            key: 'homework',
            label: (
              <>
                <BookOutlined style={{ marginRight: 4 }} />
                作业登记表
              </>
            ),
            children: <HomeworkSheet />,
          },
          {
            key: 'exam',
            label: (
              <>
                <BookOutlined style={{ marginRight: 4 }} />
                专业考试成绩表
              </>
            ),
            children: <ExamSheet />,
          },
          {
            key: 'fee-reminder',
            label: (
              <>
                <FileTextOutlined style={{ marginRight: 4 }} />
                催费记录表
              </>
            ),
            children: <FeeReminderSheet />,
          },
          {
            key: 'evening-self-study',
            label: (
              <>
                <CheckSquareOutlined style={{ marginRight: 4 }} />
                晚自习出勤表
              </>
            ),
            children: <EveningSelfStudyAttendanceSheet />,
          },
          {
            key: 'self-study-list',
            label: (
              <>
                <CheckSquareOutlined style={{ marginRight: 4 }} />
                自习签到表
              </>
            ),
            children: <SelfStudyListSheet />,
          },
          {
            key: 'speech',
            label: (
              <>
                <FileTextOutlined style={{ marginRight: 4 }} />
                班级演讲评分表
              </>
            ),
            children: <SpeechSheet />,
          },
        ]}
      />
    </div>
  )
}

export default ClassStatusSummaryTabsPage
