import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Card, Tabs, Typography, Spin, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';

const { Title } = Typography;

const ClassEmploymentInfo = lazy(
  () => import('./class-employment-detail')
);
const ClassEmploymentSummary = lazy(
  () => import('./class-employment-summary')
);

const renderLazy = (node: React.ReactNode) => (
  <Suspense fallback={<Spin style={{ margin: '24px 0' }} />}>{node}</Suspense>
);

const CampusClassEmploymentDetailPage: React.FC = () => {
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore();
  const campuses = getAllCampuses();

  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);

  useEffect(() => {
    if (!currentCampus && campuses.length > 0) {
      setCampus(campuses[0].name);
    }
  }, [currentCampus, campuses, setCampus]);

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const y = dayjs().year() - 3 + i;
        return { label: `${y}年`, value: y };
      }),
    []
  );

  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}月`, value: i + 1 })),
    []
  );

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 16 }}>
          班级就业明细（数据来源：教化司）
          {currentCampus && (
            <span style={{ marginLeft: 16, fontSize: 16, fontWeight: 'normal', color: '#666' }}>
              （{currentCampus}）
            </span>
          )}
        </Title>

        {/* 年份与月份选择栏 */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <span>年份：</span>
            <Select value={selectedYear} style={{ width: 120 }} onChange={setSelectedYear} options={yearOptions} />
            <span>月份：</span>
            <Select value={selectedMonth} style={{ width: 120 }} onChange={setSelectedMonth} options={monthOptions} />
          </Space>
        </div>

        <Tabs
          destroyInactiveTabPane
          items={[
            {
              key: 'class-employment-info',
              label: '班级就业信息',
              children: renderLazy(<ClassEmploymentInfo />),
            },
            {
              key: 'class-employment-summary',
              label: '就业总结',
              children: renderLazy(<ClassEmploymentSummary />),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default CampusClassEmploymentDetailPage;
