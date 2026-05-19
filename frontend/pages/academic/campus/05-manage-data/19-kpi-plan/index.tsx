import React, { useState, useEffect } from 'react';
import { Tabs, Card, Typography, Space, Select } from 'antd';
import type { TabsProps } from 'antd';
import { useAuthStore } from '@/stores/authStore';

import TeacherKpiAssessmentPage from './1-teacher-kpi-assessment';
import TeacherKpiTablePage from './2-teacher-kpi-result-table';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const TeacherKpiPlanTabs: React.FC = () => {
  const { user, hasPermission, roles } = useAuthStore();
  const thisYear = new Date().getFullYear();
  const thisMonth = new Date().getMonth() + 1;
  const [year, setYear] = useState<number>(thisYear);
  const [month, setMonth] = useState<number>(thisMonth);
  const [selectedTeacher, setSelectedTeacher] = useState<string | undefined>(undefined);
  const [canViewOthers, setCanViewOthers] = useState(true);

  // 检查用户权限，判断是否只能查看自己的数据
  useEffect(() => {
    const checkPermissions = () => {
      const hasViewPermission = hasPermission('academic.teacher.kpi.view');
      
      if (hasViewPermission && user) {
        // 通过角色判断：只有 teacher（学术教员）角色的用户只能看自己
        // 其他角色（chairman、academic_director、principal、academic_manager、academic_deputy_manager）可以看全部
        const isTeacher = roles.includes('teacher');
        const hasHigherRole = roles.some(role => 
          ['chairman', 'academic_director', 'principal', 'academic_manager', 'academic_deputy_manager'].includes(role)
        );
        
        console.log('[KPI权限检查]', { 
          user: user.name, 
          roles, 
          isTeacher, 
          hasHigherRole,
          canViewOthers: !(isTeacher && !hasHigherRole)
        });
        
        if (isTeacher && !hasHigherRole) {
          // 纯教员角色，只能看自己
          setCanViewOthers(false);
          setSelectedTeacher(user.name);
        } else {
          setCanViewOthers(true);
        }
      }
    };
    checkPermissions();
  }, [user, hasPermission, roles]);

  const tabItems: TabsProps['items'] = [
    {
      key: 'assessment',
      label: 'KPI考核数据',
      children: <TeacherKpiAssessmentPage year={year} month={month} selectedTeacher={selectedTeacher} canViewOthers={canViewOthers} />,
    },
    {
      key: 'result',
      label: 'KPI考核结果',
      children: <TeacherKpiTablePage year={year} month={month} selectedTeacher={selectedTeacher} canViewOthers={canViewOthers} />,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 8 }}>
          教员KPI计划与结果
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>
          选择年份与月份，以便查看或维护对应周期的数据。
        </Paragraph>

        <Space wrap style={{ marginBottom: 12 }}>
          <Space size="small">
            <span>年份：</span>
            <Select value={year} onChange={setYear} style={{ width: 120 }}>
              <Option value={2023}>2023</Option>
              <Option value={2024}>2024</Option>
              <Option value={2025}>2025</Option>
              <Option value={thisYear}>{thisYear}</Option>
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
        </Space>

        <Tabs defaultActiveKey="assessment" destroyInactiveTabPane={false} items={tabItems} type="card" />
      </Card>
    </div>
  );
};

export default TeacherKpiPlanTabs;
