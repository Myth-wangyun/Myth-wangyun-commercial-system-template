import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Card, Tabs, Typography, Empty, Space, Select, Spin } from 'antd';
import type { TabsProps } from 'antd';
import { useCampusStore } from '@/stores/campusStore';
import { fetchAssignments, fetchClasses, fetchTeachers, type AssignmentProfile, type ClassProfile, type TeacherProfile } from '@/services/configMaster';

const EmploymentAssessment = lazy(() => import('./EmploymentAssessment'));
const ReputationCommission = lazy(() => import('./ReputationCommission'));
const TeachingSatisfaction = lazy(() => import('./TeachingSatisfaction'));
const TeachingQuality = lazy(() => import('./TeachingQuality'));
const ClassroomManagement = lazy(() => import('./ClassroomManagement'));
const NewStudentStability = lazy(() => import('./NewStudentStability'));
const ConsultingSupport = lazy(() => import('./ConsultingSupport'));
const TeamBuilding = lazy(() => import('./TeamBuilding'));

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

// Props类型定义，传递给子组件
export interface RewardPunishmentProps {
  campus: string;
  classList: ClassProfile[];
  teacherList: TeacherProfile[];
  assignmentList: AssignmentProfile[];
  year: number;
  month: number;
}

const Placeholder: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ padding: 48 }}>
    <Empty
      description={
        <span>{label}模块的结构待确认，当前暂未开放，后续需求澄清后再补充。</span>
      }
    />
  </div>
);

const TeacherPerformanceRewardTabs: React.FC = () => {
  const now = new Date();
  const { currentCampus, getAllCampuses } = useCampusStore();
  const resolvedCampus = currentCampus || getAllCampuses()[0]?.name || '主神殿';
  
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [classList, setClassList] = useState<ClassProfile[]>([]);
  const [teacherList, setTeacherList] = useState<TeacherProfile[]>([]);
  const [assignmentList, setAssignmentList] = useState<AssignmentProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载班级列表和教员列表
  useEffect(() => {
    const loadData = async () => {
      if (!resolvedCampus) return;
      setLoading(true);
      try {
        const [classes, teachers, assignments] = await Promise.all([
          fetchClasses({ campus_name: resolvedCampus, active: true }),
          fetchTeachers({ campus_name: resolvedCampus, active: true }),
          fetchAssignments(),
        ]);
        setClassList(classes || []);
        setTeacherList(teachers || []);
        setAssignmentList(assignments || []);
      } catch (error) {
        console.error('加载数据失败:', error);
        setClassList([]);
        setTeacherList([]);
        setAssignmentList([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [resolvedCampus]);

  // 共享的props
  const sharedProps: RewardPunishmentProps = {
    campus: resolvedCampus,
    classList,
    teacherList,
    assignmentList,
    year,
    month,
  };

  const renderLazy = (Component: React.LazyExoticComponent<React.FC<RewardPunishmentProps>>) => (
    <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
      <Component {...sharedProps} />
    </Suspense>
  );

  const tabItems: TabsProps['items'] = [
    { key: 'employment-assessment', label: '1 就业考核', children: renderLazy(EmploymentAssessment) },
    { key: 'reputation-commission', label: '2 口碑招生提成', children: renderLazy(ReputationCommission) },
    { key: 'teaching-satisfaction', label: '3 教学满意度考核', children: renderLazy(TeachingSatisfaction) },
    { key: 'teaching-quality', label: '4 教学质量考核', children: renderLazy(TeachingQuality) },
    { key: 'classroom-management', label: '5 课堂管理考核', children: renderLazy(ClassroomManagement) },
    { key: 'new-student-stability', label: '6 新生维稳考核', children: renderLazy(NewStudentStability) },
    { key: 'consulting-support', label: '7 协助咨询转化奖励', children: renderLazy(ConsultingSupport) },
    { key: 'team-building', label: '8 团队建设奖励', children: renderLazy(TeamBuilding) },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 8 }}>
          教员业绩奖惩表
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>
          请选择神殿、年份与月份以查看/维护对应周期的数据。
        </Paragraph>

        <Space wrap style={{ marginBottom: 12 }}>
          <Space size="small">
            <span>年份：</span>
            <Select value={year} onChange={setYear} style={{ width: 120 }}>
              <Option value={2023}>2023</Option>
              <Option value={2024}>2024</Option>
              <Option value={2025}>2025</Option>
              <Option value={now.getFullYear()}>{now.getFullYear()}</Option>
            </Select>
          </Space>
          <Space size="small">
            <span>月份：</span>
            <Select value={month} onChange={setMonth} style={{ width: 120 }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <Option key={m} value={m}>{m}月</Option>
              ))}
            </Select>
          </Space>
          <Text type="secondary">当前：{resolvedCampus} {year}年{month}月</Text>
          {loading && <Spin size="small" />}
        </Space>

        <Tabs defaultActiveKey="employment-assessment" type="card" items={tabItems} />
      </Card>
    </div>
  );
};

export default TeacherPerformanceRewardTabs;
