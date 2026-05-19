/**
 * 神殿教化司核心数据 - 学员异动表
 * Sheet：汇总 + 各类异动明细（退费/休学/长期请假/长期不上课/寒暑假/其他情况）
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card, Tabs } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { useCampusStore } from '@/stores/campusStore';

import StudentFluctuationSummarySheet from './sheets/SummarySheet';
import RefundDetailSheet from './sheets/RefundDetailSheet';
import LeaveOfAbsenceSheet from './sheets/LeaveOfAbsenceSheet';
import LongTermLeaveSheet from './sheets/LongTermLeaveSheet';
import LongTermAbsenceSheet from './sheets/LongTermAbsenceSheet';
import HolidayStudentSheet from './sheets/HolidayStudentSheet';
import OtherSituationSheet from './sheets/OtherSituationSheet';



type TabKey =
  | 'summary'
  | 'refund'
  | 'leave-of-absence'
  | 'long-term-leave'
  | 'long-term-absence'
  | 'holiday-student'
  | 'other-situation';

const CoreData2StudentMovementPage: React.FC = () => {
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore();
  const campuses = getAllCampuses();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('summary');

  const detailTabs = [
    { key: 'summary' as TabKey, label: '汇总' },
    { key: 'refund' as TabKey, label: '退费明细' },
    { key: 'leave-of-absence' as TabKey, label: '休学明细' },
    { key: 'long-term-leave' as TabKey, label: '长期请假明细' },
    { key: 'long-term-absence' as TabKey, label: '长期不上课明细' },
    { key: 'holiday-student' as TabKey, label: '寒暑假学生明细' },
    { key: 'other-situation' as TabKey, label: '其他情况明细' },
  ];

  useEffect(() => {
    if (!currentCampus && campuses.length > 0) {
      setCampus(campuses[0].name);
    }
  }, [currentCampus, campuses, setCampus]);

  useEffect(() => {
    const hideSelectors = () => {
      if (!wrapperRef.current) return;

      const allCards = wrapperRef.current.querySelectorAll('.ant-card');
      allCards.forEach((card) => {
        const cardElement = card as HTMLElement;
        const cardExtra = cardElement.querySelector('.ant-card-extra');

        if (cardExtra) {
          const selects = cardExtra.querySelectorAll('.ant-select');
          selects.forEach((select) => {
            const selectElement = select as HTMLElement;
            const selectText = selectElement.textContent || '';

            if (selectText.includes('全部神殿') || selectText.includes('选择神殿')) {
              const spaceItem = selectElement.closest('.ant-space-item');
              if (spaceItem) {
                (spaceItem as HTMLElement).style.display = 'none';
              } else {
                selectElement.style.display = 'none';
              }
            }
          });
        }
      });

      const allElements = wrapperRef.current.querySelectorAll('.ant-card');
      allElements.forEach((card) => {
        const cardElement = card as HTMLElement;
        const hasSelect = card.querySelector('.ant-select');
        const hasTable = cardElement.querySelector('.ant-table') !== null;
        const hasStatistics = cardElement.querySelector('.ant-statistic') !== null;

        if (hasSelect && !hasTable && !hasStatistics) {
          const cardText = cardElement.textContent || '';
          if (cardText.includes('选择神殿') || cardText.includes('全部神殿')) {
            cardElement.style.display = 'none';
          }
        }
      });
    };

    const timers = [
      setTimeout(hideSelectors, 100),
      setTimeout(hideSelectors, 300),
      setTimeout(hideSelectors, 500),
      setTimeout(hideSelectors, 1000),
      setTimeout(hideSelectors, 2000),
    ];

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [currentCampus]);

  if (!currentCampus) {
    return null;
  }

  const renderSheet = () => {
    switch (activeTab) {
      case 'summary':
        return <StudentFluctuationSummarySheet />;
      case 'refund':
        return <RefundDetailSheet />;
      case 'leave-of-absence':
        return <LeaveOfAbsenceSheet />;
      case 'long-term-leave':
        return <LongTermLeaveSheet />;
      case 'long-term-absence':
        return <LongTermAbsenceSheet />;
      case 'holiday-student':
        return <HolidayStudentSheet />;
      case 'other-situation':
      default:
        return <OtherSituationSheet />;
    }
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        padding: '24px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Card
        style={{
          marginBottom: 24,
          backgroundColor: '#fff',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <SwapOutlined style={{ marginRight: 8 }} />
          {currentCampus} - 学员异动表
        </h1>
      </Card>

      <Card
        style={{
          marginBottom: 24,
          backgroundColor: '#fff',
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          type="card"
          items={detailTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
        />
      </Card>

      {renderSheet()}
    </div>
  );
};

export default CoreData2StudentMovementPage;
