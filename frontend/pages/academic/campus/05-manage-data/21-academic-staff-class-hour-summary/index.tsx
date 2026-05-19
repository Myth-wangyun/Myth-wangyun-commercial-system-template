// 学术 -> 数据管理 -> 教员工时汇总（实际页面）
import React, { useState } from 'react';
import { Card, Space, Select, Typography } from 'antd';
import TeacherHourStatsPage from './4-teacher-hour-summary';

const { Title, Text } = Typography;
const { Option } = Select;

const AcademicStaffClassHourSummary: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);

  return (
    <div style={{ padding: 24 }}>
      <Card bordered={false} style={{ marginBottom: 12 }}>
        <Space wrap>
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
          <Text type="secondary">当前：{year}年{month}月</Text>
        </Space>
      </Card>

      <TeacherHourStatsPage year={year} month={month} />
    </div>
  );
};

export default AcademicStaffClassHourSummary;
