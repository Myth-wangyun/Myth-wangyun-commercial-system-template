/**
 * 学员异动申请表
 * 包含安全的图片上传功能
 */
import React, { useState, useEffect } from 'react'
import { Card, Upload, Button, Space, Image, List, Typography, Tag, Spin, Select, Form, Modal, App } from 'antd'
import { UploadOutlined, DeleteOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import { useAuthStore } from '@/stores/authStore'
import { buildApiUrl, apiFetch } from '@/utils/apiBase'

const { Title, Text } = Typography

interface UploadedFile {
  filename: string
  size: number
  upload_time: number
  url: string
  path: string
}

interface StudentInfo {
  name: string
  idCard: string
  className: string
}

const StudentMovementApplicationPage: React.FC = () => {
  const { message, modal } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  
  // 学员选择相关状态
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null)
  const [classOptions, setClassOptions] = useState<string[]>([])
  const [studentOptions, setStudentOptions] = useState<StudentInfo[]>([])
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [form] = Form.useForm()

  // 加载已上传的文件列表
  const loadUploadedFiles = async (className?: string) => {
    if (!currentCampus) return
    
    setListLoading(true)
    try {
      const params = new URLSearchParams({ campus: currentCampus })
      // 如果指定了班级，添加班级参数
      if (className) {
        params.append('class_name', className)
      }
      const url = `${buildApiUrl('/teaching-quality/student-movement-application/files')}?${params.toString()}`
      const response = await apiFetch(url)
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('文件列表接口返回 404，可能后端未重启或路由未注册')
          // 404 时不显示错误，只是不显示文件列表
          setUploadedFiles([])
          return
        }
        const errorText = await response.text()
        throw new Error(`获取文件列表失败: ${errorText}`)
      }
      const data = await response.json()
      setUploadedFiles(data.files || [])
    } catch (error) {
      console.error('加载文件列表失败:', error)
      // 404 错误不显示消息，其他错误显示
      if (error instanceof Error && !error.message.includes('404')) {
        message.error('加载文件列表失败')
      }
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    if (currentCampus) {
      loadClassList()
    }
  }, [currentCampus])

  // 加载班级列表
  const loadClassList = async () => {
    if (!currentCampus) {
      console.warn('[班级列表] 当前神殿为空，无法加载班级列表')
      setClassOptions([])
      setSelectedClass('')
      return
    }
    
    console.log('[班级列表] 开始加载班级列表，神殿:', currentCampus)
    setLoadingClasses(true)
    try {
      // 尝试完整神殿名称
      let url = buildApiUrl(`/teaching-quality/class-list?campus=${encodeURIComponent(currentCampus)}`)
      console.log('[班级列表] 请求URL:', url)
      let res = await apiFetch(url)
      let list: any[] = res.ok ? await res.json() : []
      console.log('[班级列表] 第一次请求结果:', list)

      // 如果为空，尝试去掉"神殿"后缀
      if (list.length === 0 && currentCampus.endsWith('神殿')) {
        const norm = currentCampus.slice(0, -2)
        url = buildApiUrl(`/teaching-quality/class-list?campus=${encodeURIComponent(norm)}`)
        console.log('[班级列表] 第二次请求URL (去掉神殿后缀):', url)
        res = await apiFetch(url)
        list = res.ok ? await res.json() : []
        console.log('[班级列表] 第二次请求结果:', list)
      }

      // 如果还是为空，尝试不带参数查询全部
      if (list.length === 0) {
        url = buildApiUrl('/teaching-quality/class-list')
        console.log('[班级列表] 第三次请求URL (查询全部):', url)
        res = await apiFetch(url)
        list = res.ok ? await res.json() : []
        console.log('[班级列表] 第三次请求结果:', list)
      }

      const names = Array.from(new Set((list || []).map((x) => String(x['班级名称'] || '').trim()).filter(Boolean)))
      console.log('[班级列表] 提取的班级名称:', names)
      setClassOptions(names)
      
      if (names.length > 0 && !selectedClass) {
        setSelectedClass(names[0])
        console.log('[班级列表] 自动选择第一个班级:', names[0])
        await loadStudentList(names[0])
        // 加载第一个班级的异动申请表
        await loadUploadedFiles(names[0])
      } else if (names.length === 0) {
        console.warn('[班级列表] 未找到任何班级')
        message.warning('当前神殿没有找到班级，请检查神殿配置')
      }
    } catch (error) {
      console.error('[班级列表] 加载失败:', error)
      message.error('加载班级列表失败: ' + (error instanceof Error ? error.message : '未知错误'))
      setClassOptions([])
    } finally {
      setLoadingClasses(false)
    }
  }

  useEffect(() => {
    if (selectedClass) {
      loadStudentList(selectedClass)
    } else {
      setStudentOptions([])
      setSelectedStudent(null)
    }
  }, [selectedClass, currentCampus])

  // 加载学员列表
  const loadStudentList = async (className: string) => {
    if (!currentCampus || !className) {
      setStudentOptions([])
      setSelectedStudent(null)
      return
    }
    
    setLoadingStudents(true)
    try {
      const norm = currentCampus.endsWith('神殿') ? currentCampus.slice(0, -2) : currentCampus
      const url = buildApiUrl(`/teaching-quality/class-file?campus=${encodeURIComponent(norm)}&class=${encodeURIComponent(className)}`)
      const res = await apiFetch(url)
      
      if (!res.ok) {
        throw new Error('加载学员列表失败')
      }
      
      const data = await res.json()
      const rows = (data?.行列表 || []) as any[]
      
      const students: StudentInfo[] = rows
        .filter((r: any) => {
          const name = String(r.name || r.姓名 || '').trim()
          return name !== ''
        })
        .map((r: any) => ({
          name: String(r.name || r.姓名 || '').trim(),
          idCard: String(r.idCard || r.身份证号 || '').trim(),
          className: className,
        }))
      
      setStudentOptions(students)
      
      if (students.length > 0 && !selectedStudent) {
        setSelectedStudent(students[0])
      } else {
        setSelectedStudent(null)
      }
    } catch (error) {
      console.error('加载学员列表失败:', error)
      message.error('加载学员列表失败')
      setStudentOptions([])
      setSelectedStudent(null)
    } finally {
      setLoadingStudents(false)
    }
  }

  // 班级选择变化
  const handleClassChange = (className: string) => {
    setSelectedClass(className)
    setSelectedStudent(null)
    loadStudentList(className)
    // 切换班级时，重新加载该班级的异动申请表
    loadUploadedFiles(className)
  }

  // 学员选择变化
  const handleStudentChange = (value: string) => {
    const student = studentOptions.find(s => `${s.name}_${s.idCard}` === value)
    setSelectedStudent(student || null)
  }

  // 查看文件（在新标签页打开）
  const handleView = (file: UploadedFile) => {
    console.log('[查看文件]', file.filename)
    const url = getImageUrl(file.url)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // 下载文件
  const handleDownload = (file: UploadedFile) => {
    console.log('[下载文件]', file.filename)
    try {
      const url = getImageUrl(file.url)
      // 创建一个隐藏的 a 标签来触发下载
      const link = document.createElement('a')
      link.href = url
      link.download = file.filename // 设置下载文件名
      link.target = '_blank' // 在新标签页打开（如果下载失败会显示图片）
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      message.success('开始下载')
    } catch (error) {
      console.error('下载失败:', error)
      message.error('下载失败')
    }
  }

  // 删除文件
  const handleDelete = (file: UploadedFile) => {
    console.log('[删除文件]', file.filename, file)
    
    // 使用 App.useApp() 的 modal 方法
    modal.confirm({
      title: '确认删除',
      content: `确定要删除文件 "${file.filename}" 吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        try {
          console.log('[执行删除] 开始')
          console.log('[执行删除] 文件信息:', {
            campus: currentCampus,
            filename: file.filename,
            path: file.path,
          })
          
          const url = buildApiUrl('/teaching-quality/student-movement-application/delete')
          console.log('[执行删除] 请求URL:', url)
          
          const response = await apiFetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              campus: currentCampus,
              filename: file.filename,
              path: file.path,
            }),
          })

          console.log('[执行删除] 响应状态:', response.status)
          console.log('[执行删除] 响应:', response)

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('[执行删除] 错误响应:', errorData)
            throw new Error(errorData.detail || '删除失败')
          }

          const result = await response.json()
          console.log('[执行删除] 成功响应:', result)

          message.success('删除成功')
          // 重新加载文件列表，传入当前选择的班级
          await loadUploadedFiles(selectedClass)
        } catch (error) {
          console.error('[执行删除] 异常:', error)
          message.error('删除失败: ' + (error instanceof Error ? error.message : '未知错误'))
        }
      },
      onCancel: () => {
        console.log('[取消删除]', file.filename)
      },
    })
  }

  // 上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    action: buildApiUrl('/teaching-quality/student-movement-application/upload'),
    data: {
      campus: currentCampus,
    },
    accept: 'image/*',
    maxCount: 10,
    fileList,
    beforeUpload: (file) => {
      // 验证文件类型
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error('只能上传图片文件！')
        return Upload.LIST_IGNORE
      }

      // 验证文件大小（10MB，与后端配置保持一致）
      const MAX_FILE_SIZE_MB = 10
      const fileSizeMB = file.size / 1024 / 1024
      if (fileSizeMB >= MAX_FILE_SIZE_MB) {
        message.error(`图片大小不能超过 ${MAX_FILE_SIZE_MB}MB！当前文件: ${fileSizeMB.toFixed(2)}MB`)
        return Upload.LIST_IGNORE
      }

      return true
    },
    onChange: (info) => {
      setFileList(info.fileList)

      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`)
        // 重新加载文件列表，传入当前选择的班级
        loadUploadedFiles(selectedClass)
        // 清空上传列表
        setFileList([])
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`)
      }
    },
    onRemove: (file) => {
      setFileList((prevList) => prevList.filter((item) => item.uid !== file.uid))
    },
    customRequest: async ({ file, onSuccess, onError, onProgress }) => {
      // 检查是否选择了学员
      if (!selectedStudent) {
        message.error('请先选择班级和学员')
        onError?.(new Error('请先选择班级和学员'))
        return
      }

      const formData = new FormData()
      formData.append('file', file as File)
      if (currentCampus) {
        formData.append('campus', currentCampus)
      }
      if (selectedStudent.name) {
        formData.append('student_name', selectedStudent.name)
      }
      if (selectedStudent.idCard) {
        formData.append('id_card', selectedStudent.idCard)
      }

      try {
        const isAuthenticated = useAuthStore.getState().isAuthenticated

        if (!isAuthenticated) {
          message.error('未登录，请先登录')
          onError?.(new Error('未登录，请先登录'))
          return
        }

        const uploadUrl = buildApiUrl('/teaching-quality/student-movement-application/upload')
        const response = await apiFetch(uploadUrl, {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (response.ok) {
          if (data.success) {
            onSuccess?.(data, response as unknown as XMLHttpRequest)
          } else {
            onError?.(new Error(data.message || '上传失败'))
          }
        } else if (response.status === 401) {
          onError?.(new Error('未授权，请重新登录'))
        } else if (response.status === 404) {
          onError?.(new Error('接口不存在，请检查后端服务是否已重启'))
        } else {
          onError?.(new Error(data.detail || `上传失败 (${response.status})`))
        }
      } catch (error) {
        console.error('[上传] 异常:', error)
        onError?.(error as Error)
      }
    },
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString('zh-CN')
  }

  // 获取完整图片URL
  const getImageUrl = (fileUrl: string): string => {
    if (fileUrl.startsWith('http')) {
      return fileUrl
    }
    // 后端返回的 URL 已经包含完整的 API 路径，如 /api/v1/teaching-quality/...
    // 只需要拼接服务器基础地址
    // 获取服务器基础地址（去掉 /api/v1 后缀）
    const baseUrl = buildApiUrl('')
    const serverBase = baseUrl.replace(/\/api\/v1\/?$/, '')
    
    // 确保 fileUrl 以 / 开头
    const normalizedUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`
    return `${serverBase}${normalizedUrl}`
  }

  return (
    <div style={{ padding: 24 }}>
      <Card title={`${currentCampus || 'XX'}神殿 - 学员异动申请表`}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 上传区域 */}
          <Card title="上传图片" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">
                支持格式：JPG、PNG、GIF、WEBP | 最大文件大小：5MB | 最多上传10张图片
              </Text>
              
              {/* 选择班级和学员 */}
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <span>班级：</span>
                  <Select
                    style={{ width: 200 }}
                    placeholder={!currentCampus ? "请先选择神殿" : loadingClasses ? "加载中..." : "请选择班级"}
                    value={selectedClass}
                    onChange={handleClassChange}
                    loading={loadingClasses}
                    disabled={!currentCampus || loadingClasses}
                    options={classOptions.map(c => ({ label: c, value: c }))}
                    notFoundContent={loadingClasses ? <Spin size="small" /> : "暂无班级"}
                  />
                  {currentCampus && (
                    <Button 
                      size="small" 
                      onClick={loadClassList}
                      loading={loadingClasses}
                    >
                      刷新
                    </Button>
                  )}
                </Space>
                
                {selectedClass && (
                  <Space>
                    <span>学员：</span>
                    <Select
                      style={{ width: 300 }}
                      placeholder="请选择学员"
                      value={selectedStudent ? `${selectedStudent.name}_${selectedStudent.idCard}` : undefined}
                      onChange={handleStudentChange}
                      loading={loadingStudents}
                      options={studentOptions.map(s => ({
                        label: `${s.name} (${s.idCard || '无身份证号'})`,
                        value: `${s.name}_${s.idCard}`,
                      }))}
                    />
                  </Space>
                )}
              </Space>

              <Upload {...uploadProps} disabled={!selectedStudent}>
                <Button 
                  icon={<UploadOutlined />} 
                  loading={loading}
                  disabled={!selectedStudent}
                >
                  {selectedStudent ? '选择图片上传' : '请先选择班级和学员'}
                </Button>
              </Upload>
            </Space>
          </Card>

          {/* 已上传文件列表 */}
          <Card
            title={`已上传的图片${selectedClass ? ` - ${selectedClass}` : ''}`}
            extra={
              <Button onClick={() => loadUploadedFiles(selectedClass)} loading={listLoading}>
                刷新
              </Button>
            }
            size="small"
          >
            <Spin spinning={listLoading}>
              {uploadedFiles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  暂无上传的图片
                </div>
              ) : (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 }}
                  dataSource={uploadedFiles}
                  renderItem={(item) => (
                    <List.Item>
                      <Card
                        hoverable
                        cover={
                          <Image
                            src={getImageUrl(item.url)}
                            alt={item.filename}
                            style={{ width: '100%', height: 200, objectFit: 'cover' }}
                            preview={{
                              mask: <EyeOutlined />,
                            }}
                          />
                        }
                        actions={[
                          <div 
                            key="view" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleView(item)
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <EyeOutlined /> 查看
                          </div>,
                          <div 
                            key="download" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(item)
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <DownloadOutlined /> 下载
                          </div>,
                          <div 
                            key="delete" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(item)
                            }}
                            style={{ color: '#ff4d4f', cursor: 'pointer' }}
                          >
                            <DeleteOutlined /> 删除
                          </div>,
                        ]}
                      >
                        <Card.Meta
                          title={
                            <Text ellipsis style={{ width: '100%' }}>
                              {item.filename}
                            </Text>
                          }
                          description={
                            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                大小: {formatFileSize(item.size)}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                上传时间: {formatTime(item.upload_time)}
                              </Text>
                            </Space>
                          }
                        />
                      </Card>
                    </List.Item>
                  )}
                />
              )}
            </Spin>
          </Card>
        </Space>
      </Card>
    </div>
  )
}

export default StudentMovementApplicationPage
