import React, { useMemo, useState } from 'react'
import { Card, Select } from 'antd'
import ClassPromotionDetail from './ClassPromotionDetail'

const classOptions = Array.from({ length: 3 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}班`,
}))

const PromotionClassDetailSheet: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<number>(classOptions[0].value)
  const selectOptions = useMemo(() => classOptions, [])

  return (
    <>
      <Card
        style={{
          marginBottom: 24,
          backgroundColor: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 600 }}>选择班级：</span>
          <Select
            value={selectedClass}
            onChange={(value) => setSelectedClass(Number(value))}
            style={{ width: 200 }}
            options={selectOptions}
          />
        </div>
      </Card>

      <ClassPromotionDetail classNum={selectedClass} hideCampusSelector />
    </>
  )
}

export default PromotionClassDetailSheet
