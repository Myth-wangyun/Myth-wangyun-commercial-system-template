import React from 'react'
import { DatePicker, Space } from 'antd'
import dayjs from 'dayjs'

export interface WeeklyTrainingToolbarProps {
  value: string
  onChange: (value: string) => void
}

const WeeklyTrainingToolbar: React.FC<WeeklyTrainingToolbarProps> = ({ value, onChange }) => {
  return (
    <Space style={{ marginBottom: 12 }}>
      <span>年月：</span>
      <DatePicker
        picker="month"
        value={value ? dayjs(value, 'YYYY-MM') : null}
        onChange={(d) => onChange(d ? d.format('YYYY-MM') : '')}
        allowClear
      />
    </Space>
  )
}

export default WeeklyTrainingToolbar

