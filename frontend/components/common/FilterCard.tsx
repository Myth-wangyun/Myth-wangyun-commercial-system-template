import React from 'react'
import { Card, Row, Col, Typography, Input, Select, DatePicker } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Text } = Typography
const { Option } = Select

interface FilterOption {
  value: string
  label: string
}

interface FilterCardProps {
  searchText: string
  onSearchChange: (value: string) => void
  selectedDate: string
  onDateChange: (date: string) => void
  selectedCampus: string
  onCampusChange: (campus: string) => void
  campusOptions: FilterOption[]
  searchPlaceholder?: string
  showDate?: boolean
  showCampus?: boolean
  showSearch?: boolean
  extra?: React.ReactNode
}

const FilterCard: React.FC<FilterCardProps> = ({
  searchText,
  onSearchChange,
  selectedDate,
  onDateChange,
  selectedCampus,
  onCampusChange,
  campusOptions,
  searchPlaceholder = '搜索...',
  showDate = true,
  showCampus = true,
  showSearch = true,
  extra,
}) => {
  return (
    <Card style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]} align="middle">
        {showDate && (
          <Col xs={24} sm={8} md={4}>
            <Text strong>选择日期</Text>
            <DatePicker
              style={{ width: '100%', marginTop: 4 }}
              value={selectedDate ? dayjs(selectedDate) : null}
              onChange={(date) => onDateChange(date?.format('YYYY-MM-DD') || '')}
            />
          </Col>
        )}
        {showCampus && (
          <Col xs={24} sm={8} md={4}>
            <Text strong>选择神殿</Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              placeholder="请选择神殿"
              value={selectedCampus}
              onChange={onCampusChange}
              allowClear
            >
              {campusOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
        )}
        {showSearch && (
          <Col xs={24} sm={8} md={4}>
            <Text strong>搜索</Text>
            <Input
              style={{ marginTop: 4 }}
              placeholder={searchPlaceholder}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              allowClear
            />
          </Col>
        )}
        {extra && (
          <Col xs={24} sm={8} md={4}>
            {extra}
          </Col>
        )}
      </Row>
    </Card>
  )
}

export default FilterCard
