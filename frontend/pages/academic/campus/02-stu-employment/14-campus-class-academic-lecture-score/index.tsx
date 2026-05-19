import React from 'react';
import { Tabs } from 'antd';
import TeacherLectureScoresPage from './teacher_lecture_scores';
import YearlyLectureScoresSummary from './7-teacher-yearly-lecture-scores-summary';

const LectureScoreTabs: React.FC = () => {
  return (
    <Tabs
      items={[
        { key: 'sheet', label: '听课成绩表', children: <TeacherLectureScoresPage /> },
        { key: 'avg', label: '平均值', children: <YearlyLectureScoresSummary /> },
      ]}
    />
  );
};

export default LectureScoreTabs;
