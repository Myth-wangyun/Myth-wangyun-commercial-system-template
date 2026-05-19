// 班级档案表 - 所有学员状态列表容器

import React from 'react'
import { StudentStatusList } from './StudentStatusList'
import type { ClassFileRecordRow } from '../types'

interface StudentStatusListsProps {
  dataSource: ClassFileRecordRow[]
  selectedClass: string
}

export const StudentStatusLists: React.FC<StudentStatusListsProps> = ({
  dataSource,
  selectedClass
}) => {
  return (
    <>
      <StudentStatusList
        title="退费人员列表"
        dataSource={dataSource}
        status="退费"
        selectedClass={selectedClass}
      />
      <StudentStatusList
        title="休学人员列表"
        dataSource={dataSource}
        status="休学"
        selectedClass={selectedClass}
      />
      <StudentStatusList
        title="复学人员列表"
        dataSource={dataSource}
        status="复学"
        selectedClass={selectedClass}
      />
      <StudentStatusList
        title="退学人员列表"
        dataSource={dataSource}
        status="退学"
        selectedClass={selectedClass}
      />
      <StudentStatusList
        title="长期请假人员列表"
        dataSource={dataSource}
        status="长期请假"
        selectedClass={selectedClass}
      />
      <StudentStatusList
        title="长期不上课人员列表"
        dataSource={dataSource}
        status="长期不上课"
        selectedClass={selectedClass}
      />
      <StudentStatusList
        title="寒暑假人员列表"
        dataSource={dataSource}
        status="寒暑假"
        selectedClass={selectedClass}
      />
      <StudentStatusList
        title="其他情况人员列表"
        dataSource={dataSource}
        status="其他"
        selectedClass={selectedClass}
      />
    </>
  )
}
