/**
 * 019 XX神殿教化司口碑招生关键点结果汇总表
 * 入口页面 - 按顺序展示两个表格
 */

import React, { useRef } from 'react'
import { Divider, Typography } from 'antd'
import ReputationEnrollmentKeypointSummary from './1-reputation-enrollment-keypoint-summary'
import type { ReputationSummaryRef } from './1-reputation-enrollment-keypoint-summary'
import MonthlyReputationKeypointSummary from './2-reputation-enrollment-keypoint-summary-monthly'

const { Title } = Typography

const ReputationKeypointSummaryPage: React.FC = () => {
  // 创建 ref 用于调用汇总表的刷新方法
  const summaryRef = useRef<ReputationSummaryRef>(null);

  // 年度明细表保存成功后的回调
  const handleMonthlySaveSuccess = () => {
    console.log('[ReputationKeypointSummaryPage] 年度明细表保存成功，触发汇总表刷新');
    // 调用汇总表的刷新方法
    if (summaryRef.current) {
      summaryRef.current.refresh();
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f0f2f5' }}>
      {/* 第一个表格：汇总表 */}
      <div style={{ marginBottom: '32px' }}>
        <ReputationEnrollmentKeypointSummary ref={summaryRef} />
      </div>

      {/* 分隔符 */}
      <Divider style={{ margin: '32px 0' }}>
        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
          年度明细表
        </Title>
      </Divider>

      {/* 第二个表格：年度明细表 */}
      <div>
        <MonthlyReputationKeypointSummary onSaveSuccess={handleMonthlySaveSuccess} />
      </div>
    </div>
  )
}

export default ReputationKeypointSummaryPage
