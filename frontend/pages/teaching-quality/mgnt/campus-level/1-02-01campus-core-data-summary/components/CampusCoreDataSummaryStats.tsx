/**
 * 神殿教化司核心数据汇总统计卡片组件
 */

import React, { useMemo } from 'react'
import { Card, Row, Col, Statistic, Spin } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  DollarOutlined,
  HomeOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'
import type { CampusCoreDataSummaryStatsProps } from '@/types/campus-core-data-summary'

const CampusCoreDataSummaryStats: React.FC<CampusCoreDataSummaryStatsProps> = ({
  data,
  loading,
}) => {
  // 统一的卡片样式 - 玻璃质感
  const cardStyle = useMemo(
    () => ({
      textAlign: 'center' as const,
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(10px) saturate(180%)',
      WebkitBackdropFilter: 'blur(10px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative' as const,
      overflow: 'hidden' as const,
    }),
    [],
  )

  if (loading) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <Spin size="large" />
      </Card>
    )
  }

  if (data.length === 0) {
    return null
  }

  const record = data[0] // 取第一条记录作为统计数据

  // 创建统计卡片的辅助函数
  const renderStatCard = (
    title: React.ReactNode,
    value: number | string,
    config: {
      suffix?: string
      precision?: number
      titleColor: string
      valueColor: string | ((value: number) => string)
      icon: React.ReactNode
      fontSize?: string
    },
  ) => {
    const valueColor =
      typeof config.valueColor === 'function'
        ? config.valueColor(typeof value === 'number' ? value : 0)
        : config.valueColor

    return (
      <Card
        size="small"
        style={cardStyle}
        hoverable
        bodyStyle={{
          padding: '20px 16px',
          position: 'relative',
        }}
        className="stat-card-hover"
      >
        <Statistic
          title={
            <span style={{ color: config.titleColor, fontWeight: '600', fontSize: '14px' }}>
              {title}
            </span>
          }
          value={value}
          suffix={config.suffix}
          precision={config.precision}
          valueStyle={{
            color: valueColor,
            fontSize: config.fontSize || '24px',
            fontWeight: 'bold',
            marginTop: '8px',
          }}
          prefix={config.icon}
        />
      </Card>
    )
  }

  return (
    <>
      <style>{`
        .stat-card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .stat-card-hover:hover {
          background: rgba(255, 255, 255, 0.85) !important;
          backdrop-filter: blur(12px) saturate(200%) !important;
          -webkit-backdrop-filter: blur(12px) saturate(200%) !important;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
          transform: translateY(-4px) !important;
          border-color: rgba(255, 255, 255, 0.5) !important;
        }
        .stat-card-hover::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
          pointer-events: none;
        }
      `}</style>
      <Card
        title={<span style={{ fontSize: '18px', fontWeight: '600' }}>📊 关键指标概览</span>}
        style={{
          marginBottom: 16,
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px) saturate(180%)',
          WebkitBackdropFilter: 'blur(10px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Row gutter={[20, 20]}>
          {/* 第一行：基础数据 */}
          <Col xs={24} sm={12} md={6}>
            {renderStatCard('👥 学生总人数', record.totalStudents, {
              suffix: '人',
              titleColor: '#1890ff',
              valueColor: '#1890ff',
              icon: <UserOutlined style={{ color: '#1890ff', fontSize: '20px' }} />,
            })}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderStatCard('🏫 班级总个数', record.totalClasses, {
              suffix: '个',
              titleColor: '#52c41a',
              valueColor: '#52c41a',
              icon: <TeamOutlined style={{ color: '#52c41a', fontSize: '20px' }} />,
            })}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderStatCard('👨‍💼 员工总人数', record.totalEmployees, {
              suffix: '人',
              titleColor: '#722ed1',
              valueColor: '#722ed1',
              icon: <TeamOutlined style={{ color: '#722ed1', fontSize: '20px' }} />,
            })}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderStatCard('🏆 就业率', record.employmentRate, {
              suffix: '%',
              precision: 1,
              titleColor: '#fa8c16',
              valueColor: (val) => (val >= 80 ? '#52c41a' : val >= 60 ? '#fa8c16' : '#ff4d4f'),
              icon: (
                <TrophyOutlined
                  style={{
                    color:
                      record.employmentRate >= 80
                        ? '#52c41a'
                        : record.employmentRate >= 60
                          ? '#fa8c16'
                          : '#ff4d4f',
                    fontSize: '20px',
                  }}
                />
              ),
            })}
          </Col>
        </Row>

        <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
          {/* 第二行：薪资和收入 */}
          <Col xs={24} sm={12} md={6}>
            {renderStatCard('💰 平均薪资', record.averageEmploymentSalary, {
              titleColor: '#eb2f96',
              valueColor: '#eb2f96',
              icon: <DollarOutlined style={{ color: '#eb2f96', fontSize: '20px' }} />,
              fontSize: '20px',
            })}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderStatCard('💎 薪资过万人数', record.salaryOverTenThousand, {
              suffix: '人',
              titleColor: '#13c2c2',
              valueColor: '#13c2c2',
              icon: <RiseOutlined style={{ color: '#13c2c2', fontSize: '20px' }} />,
            })}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderStatCard('📈 口碑总收入', record.totalWordOfMouthRevenue, {
              precision: 0,
              titleColor: '#fa541c',
              valueColor: '#fa541c',
              icon: <DollarOutlined style={{ color: '#fa541c', fontSize: '20px' }} />,
              fontSize: '18px',
            })}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderStatCard('🎓 升学总收入', record.totalFurtherEducationRevenue, {
              precision: 0,
              titleColor: '#2f54eb',
              valueColor: '#2f54eb',
              icon: <DollarOutlined style={{ color: '#2f54eb', fontSize: '20px' }} />,
              fontSize: '18px',
            })}
          </Col>
        </Row>

        <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
          {/* 第三行：风险指标 */}
          <Col xs={24} sm={12} md={6}>
            {renderStatCard('⚠️ 退费率', record.refundRate, {
              suffix: '%',
              precision: 1,
              titleColor: '#ff4d4f',
              valueColor: (val) => (val <= 5 ? '#52c41a' : val <= 10 ? '#faad14' : '#ff4d4f'),
              icon: (
                <FallOutlined
                  style={{
                    color:
                      record.refundRate <= 5
                        ? '#52c41a'
                        : record.refundRate <= 10
                          ? '#faad14'
                          : '#ff4d4f',
                    fontSize: '20px',
                  }}
                />
              ),
            })}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderStatCard('🔄 异动率', record.turnoverRate, {
              suffix: '%',
              precision: 1,
              titleColor: '#595959',
              valueColor: (val) => (val <= 3 ? '#52c41a' : val <= 8 ? '#faad14' : '#ff4d4f'),
              icon: (
                <ExclamationCircleOutlined
                  style={{
                    color:
                      record.turnoverRate <= 3
                        ? '#52c41a'
                        : record.turnoverRate <= 8
                          ? '#faad14'
                          : '#ff4d4f',
                    fontSize: '20px',
                  }}
                />
              ),
            })}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderStatCard(
              '🏠 宿舍入住率',
              record.totalDormitories > 0
                ? (record.totalDormitoryResidents / (record.totalDormitories * 6)) * 100
                : 0,
              {
                suffix: '%',
                precision: 1,
                titleColor: '#faad14',
                valueColor: (val) => (val >= 80 ? '#52c41a' : '#faad14'),
                icon: (
                  <HomeOutlined
                    style={{
                      color:
                        record.totalDormitories > 0 &&
                        (record.totalDormitoryResidents / (record.totalDormitories * 6)) * 100 >= 80
                          ? '#52c41a'
                          : '#faad14',
                      fontSize: '20px',
                    }}
                  />
                ),
              },
            )}
          </Col>
          <Col xs={24} sm={12} md={6}>
            {renderStatCard('📊 升学率', record.furtherEducationRateByAmount, {
              suffix: '%',
              precision: 1,
              titleColor: '#9254de',
              valueColor: (val) => (val >= 10 ? '#52c41a' : val >= 5 ? '#faad14' : '#ff4d4f'),
              icon: (
                <RiseOutlined
                  style={{
                    color:
                      record.furtherEducationRateByAmount >= 10
                        ? '#52c41a'
                        : record.furtherEducationRateByAmount >= 5
                          ? '#faad14'
                          : '#ff4d4f',
                    fontSize: '20px',
                  }}
                />
              ),
            })}
          </Col>
        </Row>
      </Card>
    </>
  )
}

export default CampusCoreDataSummaryStats
