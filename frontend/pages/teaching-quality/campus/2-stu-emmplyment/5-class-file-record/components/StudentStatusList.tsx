// 班级档案表 - 学员状态列表组件

import React, { useState, useEffect } from 'react'
import { Card, Table, Row, Col, Image, Empty, Alert, Spin, Space, List } from 'antd'
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'
import type { ClassFileRecordRow } from '../types'
import { buildApiUrl } from '@/utils/apiBase'
import { useCampusStore } from '@/stores/campusStore'

interface StudentStatusListProps {
  title: string
  dataSource: ClassFileRecordRow[]
  status: string
  selectedClass: string
}

interface UploadedFile {
  filename: string
  size: number
  upload_time: number
  url: string
  path: string
}

interface StudentApplicationStatus {
  student: ClassFileRecordRow
  files: UploadedFile[]
  loading: boolean
}

const commonColumns = [
  { title: '序号', dataIndex: 'serialNumber', width: 70, align: 'center' as const },
  { title: '姓名', dataIndex: 'name', width: 100, align: 'center' as const },
  { title: '性别', dataIndex: 'gender', width: 70, align: 'center' as const },
  { title: '身份证号', dataIndex: 'idCard', width: 180, align: 'center' as const },
  { title: '入学时间', dataIndex: 'enrollmentDate', width: 110, align: 'center' as const },
  { title: '开班时间', dataIndex: 'openingDate', width: 110, align: 'center' as const },
  { title: '入学年龄', dataIndex: 'enrollmentAge', width: 90, align: 'center' as const },
  { title: '学历', dataIndex: 'education', width: 90, align: 'center' as const },
  { title: '毕业时间', dataIndex: 'graduationDate', width: 110, align: 'center' as const },
  { title: '毕业年龄', dataIndex: 'graduationAge', width: 90, align: 'center' as const },
  { title: '毕业所获最高学历证书及性质', dataIndex: 'highestEducationAndType', width: 200, align: 'left' as const, ellipsis: true },
  { title: '神殿来源', dataIndex: 'campusSource', width: 120, align: 'center' as const },
  { title: '招生神殿', dataIndex: 'enrollmentCampus', width: 120, align: 'center' as const },
  { title: '咨询师', dataIndex: 'consultant', width: 100, align: 'center' as const },
  { title: '所报专业', dataIndex: 'reportedMajor', width: 120, align: 'center' as const },
  { title: '学制', dataIndex: 'schoolingLength', width: 90, align: 'center' as const },
  { title: '应收学费金额', dataIndex: 'tuitionAmount', width: 120, align: 'center' as const },
  { title: '班主任', dataIndex: 'headTeacher', width: 100, align: 'center' as const },
  { title: '学员状态', dataIndex: 'studentStatus', width: 100, align: 'center' as const },
  { title: '过往专业', dataIndex: 'previousMajor', width: 120, align: 'center' as const },
  { title: '毕业学校', dataIndex: 'graduateSchool', width: 140, align: 'center' as const },
  { title: '联系电话', dataIndex: 'phone', width: 130, align: 'center' as const },
  { title: '家长电话', dataIndex: 'parentPhone', width: 130, align: 'center' as const },
  { title: '通信地址', dataIndex: 'address', width: 200, align: 'left' as const, ellipsis: true },
  { title: '户口性质', dataIndex: 'householdType', width: 100, align: 'center' as const },
  { title: '就读方式', dataIndex: 'studyMode', width: 100, align: 'center' as const },
  { title: '现住址', dataIndex: 'currentAddress', width: 200, align: 'left' as const, ellipsis: true },
  { title: '是否承诺注册学历', dataIndex: 'promisedRegisterEducation', width: 140, align: 'center' as const },
  { title: '承诺注册学历性质', dataIndex: 'promisedEducationNature', width: 140, align: 'left' as const },
  { title: '承诺注册学历级别', dataIndex: 'promisedEducationLevel', width: 140, align: 'center' as const },
  { title: '学历学校名称', dataIndex: 'educationSchoolName', width: 180, align: 'left' as const, ellipsis: true },
  { title: '是否已注册中专/大专', dataIndex: 'registeredSecondaryOrCollege', width: 160, align: 'center' as const },
  { title: '所注册学校', dataIndex: 'registeredSchool', width: 200, align: 'left' as const, ellipsis: true },
  { title: '备注', dataIndex: 'remark', width: 200, align: 'left' as const, ellipsis: true },
  { title: '审批无需就业', dataIndex: 'employmentApprovalStatus', width: 120, align: 'center' as const },
]



export const StudentStatusList: React.FC<StudentStatusListProps> = ({
  title,
  dataSource,
  status,
  selectedClass
}) => {
  const { currentCampus } = useCampusStore()
  const [studentStatuses, setStudentStatuses] = useState<StudentApplicationStatus[]>([])
  
  const filteredData = dataSource.filter(d => d.name && d.name.trim() && d.studentStatus === status)
  
  // 加载单个学员的异动申请表文件
  const loadApplicationFiles = async (student: ClassFileRecordRow): Promise<UploadedFile[]> => {
    if (!currentCampus || !student.name) return []
    
    try {
      const params = new URLSearchParams({ 
        campus: currentCampus,
        student_name: student.name,
        id_card: student.idCard || ''
      })
      const url = `${buildApiUrl('/teaching-quality/student-movement-application/files')}?${params.toString()}`
      const response = await fetch(url)
      
      if (!response.ok) {
        if (response.status === 404) {
          return []
        }
        throw new Error('加载异动申请表失败')
      }
      
      const data = await response.json()
      return data.files || []
    } catch (error) {
      console.error('加载异动申请表失败:', error)
      return []
    }
  }
  
  // 加载所有学员的异动申请表
  useEffect(() => {
    const loadAllApplications = async () => {
      if (!currentCampus || filteredData.length === 0) {
        setStudentStatuses([])
        return
      }
      
      // 初始化状态（显示加载中）
      const initialStatuses: StudentApplicationStatus[] = filteredData.map(student => ({
        student,
        files: [],
        loading: true
      }))
      setStudentStatuses(initialStatuses)
      
      // 并发加载所有学员的文件
      const promises = filteredData.map(async (student, index) => {
        const files = await loadApplicationFiles(student)
        return { index, files }
      })
      
      const results = await Promise.all(promises)
      
      // 更新状态
      setStudentStatuses(prev => {
        const newStatuses = [...prev]
        results.forEach(({ index, files }) => {
          if (newStatuses[index]) {
            newStatuses[index] = {
              ...newStatuses[index],
              files,
              loading: false
            }
          }
        })
        return newStatuses
      })
    }
    
    loadAllApplications()
    // 使用学员数量和选中班级作为依赖，避免无限循环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, selectedClass, filteredData.length, status])
  
  // 获取完整图片URL
  const getImageUrl = (fileUrl: string): string => {
    if (fileUrl.startsWith('http')) {
      return fileUrl
    }
    const baseUrl = buildApiUrl('')
    const serverBase = baseUrl.replace(/\/api\/v1\/?$/, '')
    const normalizedUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`
    return `${serverBase}${normalizedUrl}`
  }
  
  if (!selectedClass || filteredData.length === 0) {
    return null
  }

  // 所有状态列表都使用完整的字段信息
  const columns = commonColumns
  
  // 只有休学状态才显示左右布局
  const isLeaveStatus = status === '休学'

  return (
    <Card title={`${title} (共${filteredData.length}人)`} style={{ marginTop: 16 }} size="small">
      {isLeaveStatus ? (
        <Row gutter={16}>
          {/* 左侧：所有学员的异动申请表状态 */}
          <Col span={8}>
            <Card 
              title="学员异动申请表" 
              size="small"
              style={{ height: '100%', minHeight: 400, maxHeight: 600, overflow: 'auto' }}
            >
              <List
                dataSource={studentStatuses}
                renderItem={(item) => (
                  <List.Item key={item.student.key}>
                    <div style={{ width: '100%' }}>
                      <div style={{ marginBottom: 8 }}>
                        <strong>{item.student.name}</strong>
                        {item.student.idCard && (
                          <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                            ({item.student.idCard})
                          </span>
                        )}
                      </div>
                      
                      {item.loading ? (
                        <Spin size="small" />
                      ) : item.files.length === 0 ? (
                        <Alert
                          message="未填写申请表"
                          type="warning"
                          icon={<ExclamationCircleOutlined />}
                          showIcon
                          style={{ marginBottom: 8 }}
                        />
                      ) : (
                        <div>
                          <Alert
                            message={`已上传 ${item.files.length} 张申请表`}
                            type="success"
                            icon={<CheckCircleOutlined />}
                            showIcon
                            style={{ marginBottom: 8 }}
                          />
                          <Image.PreviewGroup>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              {item.files.map((file, index) => (
                                <Image
                                  key={index}
                                  src={getImageUrl(file.url)}
                                  alt={file.filename}
                                  style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }}
                                />
                              ))}
                            </Space>
                          </Image.PreviewGroup>
                        </div>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          
          {/* 右侧：学员列表 */}
          <Col span={16}>
            <Table<ClassFileRecordRow>
              bordered
              size="small"
              dataSource={filteredData}
              pagination={false}
              rowKey="key"
              columns={columns}
              scroll={{ x: 'max-content', y: 500 }}
            />
          </Col>
        </Row>
      ) : (
        // 其他状态直接显示表格
        <Table<ClassFileRecordRow>
          bordered
          size="small"
          dataSource={filteredData}
          pagination={false}
          rowKey="key"
          columns={columns}
          scroll={{ x: 'max-content' }}
        />
      )}
    </Card>
  )
}
