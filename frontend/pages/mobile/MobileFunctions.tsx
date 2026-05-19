/**
 * 移动端功能导航页面
 * 展示所有可用的移动端功能模块
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Collapse, Badge } from 'antd'
import { SearchOutlined, RightOutlined } from '@ant-design/icons'
import './MobileFunctions.css'

interface FunctionItem {
  title: string
  path: string
  desc?: string
}

interface FunctionGroup {
  title: string
  icon: string
  items: FunctionItem[]
}

const MobileFunctions: React.FC = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')

  const functionGroups: FunctionGroup[] = [
    {
      title: '祈福司',
      icon: '💬',
      items: [
        { title: '咨询量录入', path: '/m/consult', desc: '快速录入咨询记录' },
        { title: '我的咨询量', path: '/m/consult/my', desc: '查看我的咨询量' },
        { title: '咨询记录', path: '/m/consult/records', desc: '沟通记录管理' },
        { title: '每日咨询量汇总', path: '/m/consult/daily-summary', desc: '当日咨询量统计' },
        { title: '咨询师数据汇总', path: '/m/consult/data-summary', desc: '咨询师业绩数据' },
        { title: '每日咨询量登记表', path: '/m/consult/daily-register', desc: '咨询量登记' },
        { title: '各类人群数据汇总', path: '/m/consult/population-summary', desc: '人群分析' },
        { title: '财务收入和退费', path: '/m/consult/financial-income', desc: '财务数据' },
        { title: '人力资源基础表', path: '/m/consult/hr-basic', desc: 'HR数据' },
        { title: '员工职数和功能分析', path: '/m/consult/staff-function', desc: '员工分析' },
        { title: '最高议事厅核心数据看板', path: '/m/consult/mgnt-dashboard', desc: '核心数据' },
        { title: '神殿年月表-各媒体来源', path: '/m/consult/yearly-media', desc: '媒体来源分析' },
        { title: '员工访谈记录', path: '/m/consult/staff-interview', desc: '访谈记录' },
        { title: '会议记录', path: '/m/consult/meeting-record', desc: '会议记录' },
        { title: '电话标准化检查', path: '/m/consult/phone-check', desc: '电话检查' },
        { title: '当面标准化检查', path: '/m/consult/face-to-face-check', desc: '当面检查' },
        { title: '培训汇总', path: '/m/consult/training', desc: '培训记录' },
        { title: '导出审批', path: '/m/consult/export-approval', desc: '审批管理' },
      ],
    },
    {
      title: '智慧司',
      icon: '📚',
      items: [
        { title: '核心业务数据汇总', path: '/m/academic/core-summary', desc: '核心数据' },
        { title: '班级就业明细表', path: '/m/academic/class-employment-detail', desc: '就业明细' },
        { title: '项目计划表', path: '/m/academic/project-plan', desc: '项目计划' },
        { title: '班排课表', path: '/m/academic/course-schedule', desc: '课程安排' },
        { title: '班薪资预估表', path: '/m/academic/salary-estimate', desc: '薪资预估' },
        { title: '班作业成绩表', path: '/m/academic/assignment-score', desc: '作业成绩' },
        { title: '班考试成绩表', path: '/m/academic/exam-score', desc: '考试成绩' },
        { title: '班项目成绩表', path: '/m/academic/project-score', desc: '项目成绩' },
        { title: '压力面试成绩表', path: '/m/academic/pressure-interview-score', desc: '面试成绩' },
        { title: '学员满意度成绩表', path: '/m/academic/student-satisfaction', desc: '满意度' },
        { title: '听课成绩表', path: '/m/academic/lecture-score', desc: '听课记录' },
        { title: '口碑招生目标与结果', path: '/m/academic/reputation-goals', desc: '口碑招生' },
        { title: '口碑招生计划与执行', path: '/m/academic/reputation-self-check', desc: '执行统计' },
        { title: '口碑关键点结果汇总', path: '/m/academic/reputation-key-points', desc: '关键点' },
        { title: '每日新生安排表', path: '/m/academic/new-student-schedule', desc: '新生安排' },
        { title: '教员访谈记录', path: '/m/academic/staff-interview', desc: '访谈记录' },
        { title: '会议记录', path: '/m/academic/meeting-record', desc: '会议记录' },
        { title: '教员KPI计划表', path: '/m/academic/kpi-plan', desc: 'KPI计划' },
        { title: '教员业绩奖惩表', path: '/m/academic/performance-reward', desc: '奖惩记录' },
        { title: '教员课时统计表', path: '/m/academic/class-hour-stats', desc: '课时统计' },
        { title: '教员功能分析总表', path: '/m/academic/teacher-function-analysis', desc: '功能分析' },
        { title: '企业文化宣讲计划', path: '/m/academic/culture-presentation', desc: '文化宣讲' },
        { title: '企业文化考试计划', path: '/m/academic/culture-exam', desc: '文化考试' },
        { title: '教员日工单', path: '/m/academic/teacher-daily-work', desc: '日常工作' },
      ],
    },
    {
      title: '教化司',
      icon: '🎓',
      items: [
        { title: '核心业务数据汇总', path: '/m/teaching-quality/core-summary', desc: '核心数据' },
        { title: '班级就业汇总表', path: '/m/teaching-quality/class-employment-summary', desc: '就业汇总' },
        { title: '就业明星汇总表', path: '/m/teaching-quality/employment-star', desc: '就业明星' },
        { title: '班级就业信息表', path: '/m/teaching-quality/class-employment-info', desc: '就业信息' },
        { title: '班级就业明细表', path: '/m/teaching-quality/class-employment-detail', desc: '就业明细' },
        { title: '就业期计划与监督', path: '/m/teaching-quality/employment-period-plan', desc: '就业计划' },
        { title: '强化期计划与监督', path: '/m/teaching-quality/intensify-period-plan', desc: '强化计划' },
        { title: '班薪资预估表', path: '/m/teaching-quality/salary-estimate', desc: '薪资预估' },
        { title: '班档案信息表', path: '/m/teaching-quality/class-file-record', desc: '班级档案' },
        { title: '班千分制统计', path: '/m/teaching-quality/thousand-score', desc: '千分制' },
        { title: '班级情况表', path: '/m/teaching-quality/class-status-summary', desc: '班级情况' },
        { title: '压力面试成绩表', path: '/m/teaching-quality/pressure-interview', desc: '面试成绩' },
        { title: '压力面试打分表', path: '/m/teaching-quality/pressure-interview-rating', desc: '面试打分' },
        { title: '口碑招生计划与执行', path: '/m/teaching-quality/reputation-plan', desc: '口碑计划' },
        { title: '口碑关键点结果汇总', path: '/m/teaching-quality/reputation-key-points', desc: '关键点' },
        { title: '活动计划安排表', path: '/m/teaching-quality/activity-plan', desc: '活动计划' },
        { title: '后端每日新生安排', path: '/m/teaching-quality/new-student-schedule', desc: '新生安排' },
        { title: '升学计划表', path: '/m/teaching-quality/promotion-plan', desc: '升学计划' },
        { title: '学员异动申请表', path: '/m/teaching-quality/student-movement-application', desc: '异动申请' },
        { title: '住宿费交款通知', path: '/m/teaching-quality/dorm-fee-notice', desc: '住宿费' },
        { title: '员工功能分析表', path: '/m/teaching-quality/employee-function', desc: '功能分析' },
        { title: '员工KPI计划表', path: '/m/teaching-quality/employee-kpi', desc: 'KPI计划' },
        { title: '员工访谈表', path: '/m/teaching-quality/employee-interview', desc: '访谈记录' },
        { title: '会议记录表', path: '/m/teaching-quality/tq-meeting-record', desc: '会议记录' },
        { title: '培训计划与成绩明细', path: '/m/teaching-quality/training-plan-score', desc: '培训记录' },
        { title: '企业文化宣讲计划', path: '/m/teaching-quality/culture-presentation', desc: '文化宣讲' },
        { title: '企业文化考试计划', path: '/m/teaching-quality/culture-exam', desc: '文化考试' },
        { title: '咨询量交接列表', path: '/m/teaching-quality/handover-list', desc: '交接管理' },
        { title: '班主任日工单', path: '/m/teaching-quality/homeroom-daily-work', desc: '日常工作' },
        { title: '学员异动表', path: '/m/teaching-quality/student-movement', desc: '学员异动' },
        { title: '新生维稳统计表', path: '/m/teaching-quality/new-student-stability', desc: '维稳统计' },
        { title: '宿舍统计表', path: '/m/teaching-quality/dormitory-stats', desc: '宿舍管理' },
        { title: '学籍管理表', path: '/m/teaching-quality/enrollment-stats', desc: '学籍管理' },
        { title: '学员访谈记录', path: '/m/teaching-quality/student-interviews', desc: '访谈记录' },
        { title: '标准化检查表', path: '/m/teaching-quality/standardization-check', desc: '标准化检查' },
      ],
    },
    {
      title: '市场部',
      icon: '📊',
      items: [
        { title: 'SEM日常数据表', path: '/m/market/sem-daily', desc: 'SEM数据' },
        { title: '口碑日度数据表', path: '/m/market/reputation-daily', desc: '口碑数据' },
        { title: '本月业务推进表', path: '/m/market/monthly-progress', desc: '业务推进' },
        { title: '合作方联系信息', path: '/m/market/partner-contacts', desc: '合作方' },
        { title: '网络合作伙伴日度数据', path: '/m/market/online-partner-daily', desc: '合作伙伴' },
        { title: '全员功能分析', path: '/m/market/staff-function', desc: '功能分析' },
        { title: '月度详细计划', path: '/m/market/monthly-plan', desc: '月度计划' },
        { title: '新媒体汇总', path: '/m/market/new-media-summary', desc: '新媒体' },
        { title: '新媒体平台明细', path: '/m/market/new-media-platform-detail', desc: '平台明细' },
        { title: '网络汇总', path: '/m/market/network-summary', desc: '网络数据' },
        { title: '网络合作伙伴月度', path: '/m/market/network-partner-monthly', desc: '月度数据' },
        { title: '网络合作伙伴年度', path: '/m/market/network-partner-annual', desc: '年度数据' },
        { title: '渠道费用', path: '/m/market/channel-expense', desc: '费用管理' },
        { title: '渠道咨询师', path: '/m/market/channel-consultant', desc: '咨询师' },
        { title: 'SEM计划', path: '/m/market/sem-plan', desc: 'SEM计划' },
        { title: 'SEM月度', path: '/m/market/sem-monthly', desc: 'SEM月度' },
        { title: 'SEM年度', path: '/m/market/sem-annual', desc: 'SEM年度' },
        { title: '培训汇总', path: '/m/market/training-summary', desc: '培训记录' },
        { title: '会议记录', path: '/m/market/meeting-record', desc: '会议记录' },
        { title: '核心数据汇总', path: '/m/market/core-summary', desc: '核心数据' },
      ],
    },
    {
      title: '就业管理',
      icon: '💼',
      items: [
        { title: '就业目标与结果', path: '/m/employment/goals', desc: '就业目标' },
      ],
    },
    {
      title: '系统管理',
      icon: '⚙️',
      items: [
        { title: '审计日志', path: '/m/system/audit-log', desc: '系统日志' },
        { title: '人员管理', path: '/m/staff', desc: '部门人员' },
        { title: '通知公告', path: '/m/notifications', desc: '系统通知' },
        { title: '审批中心', path: '/m/approvals', desc: '审批管理' },
      ],
    },
  ]

  // 过滤功能
  const filteredGroups = functionGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item.title.toLowerCase().includes(searchText.toLowerCase()) ||
          item.desc?.toLowerCase().includes(searchText.toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="m-functions-page">
      <div className="m-functions-header">
        <h2>功能导航</h2>
        <p>共 {functionGroups.reduce((sum, g) => sum + g.items.length, 0)} 个功能</p>
      </div>

      <div className="m-functions-search">
        <Input
          placeholder="搜索功能..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      <div className="m-functions-content">
        {filteredGroups.map((group, idx) => (
          <div key={idx} className="m-function-group">
            <div className="m-function-group-header">
              <span className="m-function-group-icon">{group.icon}</span>
              <span className="m-function-group-title">{group.title}</span>
              <Badge count={group.items.length} style={{ backgroundColor: '#1677ff' }} />
            </div>
            <div className="m-function-list">
              {group.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="m-function-item"
                  onClick={() => navigate(item.path)}
                >
                  <div className="m-function-item-content">
                    <div className="m-function-item-title">{item.title}</div>
                    {item.desc && <div className="m-function-item-desc">{item.desc}</div>}
                  </div>
                  <RightOutlined className="m-function-item-arrow" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="m-functions-empty">
            <p>未找到匹配的功能</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MobileFunctions
