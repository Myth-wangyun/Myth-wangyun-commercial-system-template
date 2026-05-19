/**
 * 神殿教化司核心数据 - 学籍管理表
 * Sheet：汇总 + 各类学籍注册花名册
 */

import React, { useEffect, useRef, useState } from 'react';
import { Card, Tabs } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { useCampusStore } from '@/stores/campusStore';

import StudentStatusSummarySheet from './sheets/SummarySheet';
import SecondarySchool3YearSheet from './sheets/SecondarySchool3YearSheet';
import SecondarySchool1YearSheet from './sheets/SecondarySchool1YearSheet';
import OtherSecondarySheet from './sheets/OtherSecondarySheet';
import AdultEducationSheet from './sheets/AdultEducationSheet';
import OpenUniversitySheet from './sheets/OpenUniversitySheet';
import OtherHigherEducationSheet from './sheets/OtherHigherEducationSheet';



type TabKey =
  | 'summary'
  | 'secondary-school-3year'
  | 'secondary-school-1year'
  | 'other-secondary'
  | 'adult-education'
  | 'open-university'
  | 'other-higher-education';

const CoreData2EnrollmentStatisticsPage: React.FC = () => {
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore();
  const campuses = getAllCampuses();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('summary');

  const detailTabs = [
    { key: 'summary' as TabKey, label: '汇总' },
    { key: 'secondary-school-3year' as TabKey, label: '中专3年注册花名册' },
    { key: 'secondary-school-1year' as TabKey, label: '中专1年注册花名册' },
    { key: 'other-secondary' as TabKey, label: '其他中等教育花名册' },
    { key: 'adult-education' as TabKey, label: '成考注册花名册' },
    { key: 'open-university' as TabKey, label: '国开注册花名册' },
    { key: 'other-higher-education' as TabKey, label: '其他高等教育花名册' },
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
        return <StudentStatusSummarySheet />;
      case 'secondary-school-3year':
        return <SecondarySchool3YearSheet />;
      case 'secondary-school-1year':
        return <SecondarySchool1YearSheet />;
      case 'other-secondary':
        return <OtherSecondarySheet />;
      case 'adult-education':
        return <AdultEducationSheet />;
      case 'open-university':
        return <OpenUniversitySheet />;
      case 'other-higher-education':
      default:
        return <OtherHigherEducationSheet />;
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
          <BookOutlined style={{ marginRight: 8 }} />
          {currentCampus} - 学籍管理表
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

export default CoreData2EnrollmentStatisticsPage;

