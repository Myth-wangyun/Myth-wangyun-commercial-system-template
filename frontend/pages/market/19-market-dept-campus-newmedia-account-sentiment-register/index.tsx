import React, { useEffect, useMemo, useState } from 'react'
import { App, Button, Card, Image, Input, Modal, Space, Table, Tabs, Typography, Upload } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { UploadProps } from 'antd'
import { DeleteOutlined, PlusOutlined, ReloadOutlined, SaveOutlined, UploadOutlined, ImportOutlined } from '@ant-design/icons'
import { fetchCampuses } from '@/services/configMaster'
import { apiService } from '@/services/api'
import { buildApiUrl, apiFetch } from '@/utils/apiBase'
import { useAuthStore } from '@/stores/authStore'
import { useCampusStore } from '@/stores/campusStore'

const { Title } = Typography

// 获取完整图片URL
const getImageUrl = (fileUrl: string): string => {
  if (!fileUrl) return ''
  if (fileUrl.startsWith('http')) {
    return fileUrl
  }
  // 后端返回的 URL 已经包含完整的 API 路径
  const baseUrl = buildApiUrl('')
  const serverBase = baseUrl.replace(/\/api\/v1\/?$/, '')
  const normalizedUrl = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`
  return `${serverBase}${normalizedUrl}`
}

// 数据类型
interface AccountRecord {
  id: number | string  // 后端返回的是数字id，新增行用临时字符串id
  index: number
  inchargeInside: string
  inchargeOutside: string
  platform: string
  accountId: string
  nickname: string
  avatar: string
  remark?: string
}

const emptyRow = (index: number): AccountRecord => ({
  id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  index,
  inchargeInside: '',
  inchargeOutside: '',
  platform: '',
  accountId: '',
  nickname: '',
  avatar: '',
  remark: '',
})

const AccountSentimentPage: React.FC = () => {
  const { message, modal } = App.useApp()
  const [campuses, setCampuses] = useState<Array<{ code: string; name: string }>>([])
  const [activeCampus, setActiveCampus] = useState<string>('')

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [importing, setImporting] = useState(false)
  const [dataByCampus, setDataByCampus] = useState<Record<string, AccountRecord[]>>({})

  const currentTableData = useMemo(() => {
    if (!activeCampus) return []
    return dataByCampus[activeCampus] || []
  }, [activeCampus, dataByCampus])

  const loadCampuses = async () => {
    try {
      const list = await fetchCampuses()
      const activeList = (Array.isArray(list) ? list : [])
        .filter((c) => c.is_active)
        .map((c) => ({ code: c.code, name: c.name }))

      // 定义神殿排序顺序：盛邦、冀美、石美、晋美、原美、太美、桂美、邕美、黔美
      const campusOrder = ['河北盛邦', '河北冀美', '河北石美', '山西晋美', '山西原美', '山西太美', '广西桂美', '广西邕美', '贵州黔美']
      const orderMap = new Map<string, number>()
      campusOrder.forEach((campus, index) => {
        orderMap.set(campus, index)
        // 也支持带"神殿"后缀的格式
        orderMap.set(campus + '神殿', index)
      })

      // 按照指定顺序排序
      const sortedActiveList = activeList.sort((a, b) => {
        const orderA = orderMap.get(a.name) ?? orderMap.get(a.name.replace('神殿', '')) ?? 999
        const orderB = orderMap.get(b.name) ?? orderMap.get(b.name.replace('神殿', '')) ?? 999
        return orderA - orderB
      })

      const tabs = [{ code: 'management-center', name: '最高议事厅' }, ...sortedActiveList]
      setCampuses(tabs)
      if (!activeCampus && tabs.length > 0) {
        setActiveCampus(tabs[0].name)
      }
    } catch (e) {
      message.error('加载神殿列表失败')
      setCampuses([])
    }
  }

  const loadCampusData = async (campusName: string) => {
    try {
      // 从后端 API 加载数据
      // apiService.get 返回的就是后端响应体本身
      const response = await apiService.get<{
        campus_name: string
        items: Array<{
          id: number
          campus_name: string
          inchargeInside: string
          inchargeOutside: string
          platform: string
          accountId: string
          nickname: string
          avatar: string
          remark: string
          created_at: string
          updated_at: string
        }>
      }>('/market/account-sentiment', {
        params: { campus_name: campusName }
      })
      
      // response 就是后端返回的数据，直接使用 response.items
      const resData = response as any
      const items = resData?.items || []
      const normalized = items.map((r: any, idx: number) => ({
        id: r.id,
        index: idx + 1,
        inchargeInside: r.inchargeInside || '',
        inchargeOutside: r.inchargeOutside || '',
        platform: r.platform || '',
        accountId: r.accountId || '',
        nickname: r.nickname || '',
        avatar: r.avatar || '',
        remark: r.remark || '',
      }))

      setDataByCampus((prev) => ({
        ...prev,
        [campusName]: normalized,
      }))
    } catch (e) {
      console.error('加载数据失败:', e)
      setDataByCampus((prev) => ({
        ...prev,
        [campusName]: [],
      }))
    }
  }

  const loadActiveCampusData = async () => {
    if (!activeCampus) return
    setLoading(true)
    try {
      await loadCampusData(activeCampus)
      setDirty(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampuses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadActiveCampusData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCampus])

  const saveData = async () => {
    if (!activeCampus) return
    setSaving(true)
    try {
      // 准备要保存的数据，转换为后端需要的格式
      const rows = currentTableData.map((r) => ({
        inchargeInside: r.inchargeInside,
        inchargeOutside: r.inchargeOutside,
        platform: r.platform,
        accountId: r.accountId,
        nickname: r.nickname,
        avatar: r.avatar,
        remark: r.remark || '',
      }))

      // 调用后端 API 保存数据
      // apiService.post 返回的就是后端响应体本身
      const response = await apiService.post<{
        campus_name: string
        saved_count: number
        items: Array<{
          id: number
          campus_name: string
          inchargeInside: string
          inchargeOutside: string
          platform: string
          accountId: string
          nickname: string
          avatar: string
          remark: string
          created_at: string
          updated_at: string
        }>
      }>('/market/account-sentiment/bulk-save', {
        campus_name: activeCampus,
        rows,
      })

      // response 就是后端返回的数据，直接使用 response.items
      const resData = response as any
      const items = resData?.items || []
      const normalized = items.map((r: any, idx: number) => ({
        id: r.id,
        index: idx + 1,
        inchargeInside: r.inchargeInside || '',
        inchargeOutside: r.inchargeOutside || '',
        platform: r.platform || '',
        accountId: r.accountId || '',
        nickname: r.nickname || '',
        avatar: r.avatar || '',
        remark: r.remark || '',
      }))

      setDataByCampus((prev) => ({
        ...prev,
        [activeCampus]: normalized,
      }))

      setDirty(false)
      message.success('保存成功')
    } catch (e: any) {
      console.error('保存失败:', e)
      message.error(e?.response?.data?.detail || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const updateCell = (
    rowId: number | string,
    key: keyof Omit<AccountRecord, 'id' | 'index'>,
    value: string,
  ) => {
    if (!activeCampus) return
    setDataByCampus((prev) => {
      const list = prev[activeCampus] || []
      const next = list.map((r) => (r.id === rowId ? { ...r, [key]: value } : r))
      return {
        ...prev,
        [activeCampus]: next,
      }
    })
    setDirty(true)
  }

  const handleAddRow = () => {
    if (!activeCampus) return
    setDataByCampus((prev) => {
      const list = prev[activeCampus] || []
      const next = [...list, emptyRow(list.length + 1)]
      return {
        ...prev,
        [activeCampus]: next,
      }
    })
    setDirty(true)
  }

  const handleDeleteRow = (row: AccountRecord) => {
    if (!activeCampus) return
    setDataByCampus((prev) => {
      const list = prev[activeCampus] || []
      const next = list
        .filter((r) => r.id !== row.id)
        .map((r, idx) => ({ ...r, index: idx + 1 }))
      return {
        ...prev,
        [activeCampus]: next,
      }
    })
    setDirty(true)
  }

  const handleDeleteAvatar = async (recordId: number | string) => {
    console.log('handleDeleteAvatar called, recordId:', recordId, 'activeCampus:', activeCampus)
    if (!activeCampus) {
      console.log('No active campus, returning')
      return
    }
    
    // 找到对应的记录
    const record = currentTableData.find(r => r.id === recordId)
    if (!record || !record.avatar) {
      message.warning('没有找到要删除的图片')
      return
    }
    
    // 使用浏览器原生确认框
    if (window.confirm('确定要删除这张图片吗？删除后将无法恢复。')) {
      console.log('Confirmed, deleting avatar')
      
      try {
        // 调用后端 API 删除文件
        const deleteUrl = buildApiUrl('/market/account-sentiment/delete-file')
        const token = useAuthStore.getState().token
        const campus = useCampusStore.getState().currentCampus
        
        const response = await fetch(`${deleteUrl}?file_url=${encodeURIComponent(record.avatar)}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(campus ? { 'X-Campus': btoa(encodeURIComponent(campus)) } : {}),
          },
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('File deleted from server:', result)
          
          // 清空前端的 avatar 字段
          updateCell(recordId, 'avatar', '')
          setDirty(true)
          message.success('图片已删除')
        } else {
          // 即使服务器删除失败，也清空前端字段（可能文件已经不存在了）
          const errorData = await response.json().catch(() => ({}))
          console.warn('Server delete failed:', errorData)
          
          // 如果是404错误（文件不存在），仍然清空前端字段
          if (response.status === 404) {
            updateCell(recordId, 'avatar', '')
            setDirty(true)
            message.success('图片已删除')
          } else {
            message.error(errorData.detail || '删除文件失败，但已清空记录')
            updateCell(recordId, 'avatar', '')
            setDirty(true)
          }
        }
      } catch (error) {
        console.error('Delete avatar error:', error)
        // 即使删除失败，也清空前端字段
        updateCell(recordId, 'avatar', '')
        setDirty(true)
        message.warning('删除文件时出错，但已清空记录')
      }
    } else {
      console.log('Cancelled')
    }
  }

  // 从Excel导入数据
  const handleImportExcel = async (file: File) => {
    // 检查文件类型
    const fileName = file.name.toLowerCase()
    const isXlsx = fileName.endsWith('.xlsx')
    const isXls = fileName.endsWith('.xls')
    
    if (!isXlsx && !isXls) {
      message.error('请上传 .xlsx 或 .xls 格式的Excel文件')
      return false
    }

    setImporting(true)
    const hideLoading = message.loading('正在读取Excel文件...', 0)
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const XLSX = await import('xlsx')
      
      // 根据文件类型选择不同的读取方式
      const workbook = XLSX.read(arrayBuffer, { 
        type: 'array',
        cellStyles: true,
        // 对于 .xls 文件，需要指定 bookType
        ...(isXls ? { bookType: 'xls' } : {}),
      })
      
      // 获取所有工作表
      const sheetNames = workbook.SheetNames
      
      if (sheetNames.length === 0) {
        message.error('Excel文件中没有工作表')
        return false
      }

      hideLoading()
      message.loading(`发现 ${sheetNames.length} 个工作表，正在解析...`, 0)

      // 用于存储所有sheet的导入结果
      const allSheetData: Record<string, AccountRecord[]> = {}
      let totalRecordsCount = 0
      let totalImagesCount = 0

      // 遍历所有工作表
      for (let sheetIndex = 0; sheetIndex < sheetNames.length; sheetIndex++) {
        const sheetName = sheetNames[sheetIndex]
        const worksheet = workbook.Sheets[sheetName]
        
        // 解析数据（跳过标题行）
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]
        
        if (jsonData.length < 2) {
          console.warn(`工作表 "${sheetName}" 中没有数据，跳过`)
          continue
        }

        // 解析数据行（跳过表头）
        const sheetRecords: AccountRecord[] = []
        let lastInchargeInside = '' // 用于处理合并单元格
        let lastInchargeOutside = '' // 用于处理合并单元格
        
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i]
          
          // 跳过空行（所有单元格都为空）
          if (!row || row.every((cell) => !cell)) continue
          
          // 跳过表头行（检测包含表头关键字的行）
          const rowStr = row.join('').trim()
          const isHeaderRow = (
            (rowStr.includes('序号') || rowStr.includes('编号')) &&
            (rowStr.includes('维护') || rowStr.includes('老师')) &&
            (rowStr.includes('新媒体') || rowStr.includes('平台') || rowStr.includes('ID账号'))
          )
          
          if (isHeaderRow) {
            console.log(`跳过表头行 ${i + 1}:`, rowStr)
            continue
          }

          // 读取各列数据
          const inchargeInside = String(row[1] || '').trim()
          const inchargeOutside = String(row[2] || '').trim()
          const platform = String(row[3] || '').trim()
          const accountId = String(row[4] || '').trim()
          const nickname = String(row[5] || '').trim()
          const remark = String(row[7] || '').trim()

          // 如果没有平台和账号信息，跳过这一行（可能是空行或无效数据）
          if (!platform && !accountId && !nickname) {
            continue
          }

          // 处理合并单元格：如果当前行的姓名为空，使用上一行的姓名
          const finalInchargeInside = inchargeInside || lastInchargeInside
          const finalInchargeOutside = inchargeOutside || lastInchargeOutside

          // 更新最后的姓名（用于下一行）
          if (inchargeInside) {
            lastInchargeInside = inchargeInside
          }
          if (inchargeOutside) {
            lastInchargeOutside = inchargeOutside
          }

          const record: AccountRecord = {
            id: `temp-${Date.now()}-${Math.random().toString(16).slice(2)}-${sheetIndex}-${i}`,
            index: sheetRecords.length + 1,
            inchargeInside: finalInchargeInside,
            inchargeOutside: finalInchargeOutside,
            platform,
            accountId,
            nickname,
            avatar: '', // 先设置为空，后续处理图片
            remark,
          }

          sheetRecords.push(record)
        }

        if (sheetRecords.length > 0) {
          allSheetData[sheetName] = sheetRecords
          totalRecordsCount += sheetRecords.length
        }
      }

      if (Object.keys(allSheetData).length === 0) {
        message.error('所有工作表中都没有有效数据')
        return false
      }

      // 提取图片 - 使用 ExcelJS 来处理图片（仅支持 .xlsx 格式）
      const imagesBySheet: Record<string, Record<string, { base64: string; extension: string }>> = {}
      
      if (isXlsx) {
        try {
          message.loading('正在提取图片...', 0)
          const ExcelJS = await import('exceljs')
          const excelWorkbook = new ExcelJS.Workbook()
          await excelWorkbook.xlsx.load(arrayBuffer)
          
          // 遍历所有工作表提取图片
          excelWorkbook.worksheets.forEach((excelWorksheet, index) => {
            const sheetName = sheetNames[index]
            if (!allSheetData[sheetName]) return
            
            const images: Record<string, { base64: string; extension: string }> = {}
            
            // 提取工作表中的图片
            if (excelWorksheet && excelWorksheet.getImages) {
              excelWorksheet.getImages().forEach((image: any) => {
                const img = excelWorkbook.getImage(image.imageId)
                if (img && img.buffer) {
                  // 获取图片所在的单元格位置
                  const { nativeRow, nativeCol } = image.range.tl
                  const cellRef = XLSX.utils.encode_cell({ r: nativeRow, c: nativeCol })
                  
                  // 转换为base64
                  const base64 = Buffer.from(img.buffer).toString('base64')
                  images[cellRef] = {
                    base64,
                    extension: img.extension || 'png',
                  }
                  totalImagesCount++
                }
              })
            }
            
            if (Object.keys(images).length > 0) {
              imagesBySheet[sheetName] = images
            }
          })
        } catch (imgError) {
          console.warn('提取图片失败，将跳过图片导入:', imgError)
        }
      }

      // 将图片数据关联到记录
      // 注意：由于Excel中可能有合并单元格和表头，需要更智能地匹配图片
      for (const [sheetName, records] of Object.entries(allSheetData)) {
        const images = imagesBySheet[sheetName] || {}
        
        // 遍历所有图片，尝试根据行号匹配到记录
        const imageEntries = Object.entries(images)
        
        records.forEach((record, index) => {
          // 尝试多种方式匹配图片
          // 1. 精确匹配：图片在第7列（索引6），数据行从第2行开始（索引1）
          let imageCellRef = XLSX.utils.encode_cell({ r: index + 1, c: 6 })
          let imageData = images[imageCellRef]
          
          // 2. 如果没找到，尝试偏移查找（考虑表头可能占多行）
          if (!imageData) {
            imageCellRef = XLSX.utils.encode_cell({ r: index + 2, c: 6 })
            imageData = images[imageCellRef]
          }
          
          // 3. 如果还是没找到，尝试查找附近的图片
          if (!imageData && imageEntries.length > 0) {
            // 查找行号最接近的图片
            for (const [cellRef, imgData] of imageEntries) {
              const cellPos = XLSX.utils.decode_cell(cellRef)
              // 如果图片在第6或7列，且行号在合理范围内
              if ((cellPos.c === 6 || cellPos.c === 7) && 
                  Math.abs(cellPos.r - (index + 1)) <= 2) {
                imageData = imgData
                break
              }
            }
          }
          
          if (imageData) {
            record.avatar = `data:image/${imageData.extension};base64,${imageData.base64}`
          }
        })
      }

      message.destroy()
      message.loading(`正在上传图片... (0/${totalImagesCount})`, 0)

      // 上传图片并保存数据到各个神殿
      let uploadedImagesCount = 0
      const savedSheets: string[] = []
      const failedSheets: string[] = []

      for (const [sheetName, records] of Object.entries(allSheetData)) {
        try {
          // 查找匹配的神殿
          const matchedCampus = campuses.find(c => 
            c.name === sheetName || 
            c.name.includes(sheetName) || 
            sheetName.includes(c.name)
          )

          if (!matchedCampus) {
            console.warn(`工作表 "${sheetName}" 没有匹配的神殿，跳过`)
            failedSheets.push(sheetName)
            continue
          }

          const campusName = matchedCampus.name

          // 上传图片
          const recordsWithUploadedImages: AccountRecord[] = []
          for (const record of records) {
            if (record.avatar && record.avatar.startsWith('data:')) {
              try {
                // 将base64转换为Blob
                const base64Data = record.avatar.split(',')[1]
                const mimeType = record.avatar.match(/data:([^;]+);/)?.[1] || 'image/png'
                const byteCharacters = atob(base64Data)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: mimeType })
                
                // 创建File对象
                const extension = mimeType.split('/')[1] || 'png'
                const fileName = `import-${record.accountId || Date.now()}.${extension}`
                const imageFile = new File([blob], fileName, { type: mimeType })

                // 上传图片
                const formData = new FormData()
                formData.append('file', imageFile)
                formData.append('campus_name', campusName)
                formData.append('account_id', record.accountId || record.id.toString())

                const token = useAuthStore.getState().token
                const campus = useCampusStore.getState().currentCampus

                const uploadUrl = buildApiUrl('/market/account-sentiment/upload')
                const response = await fetch(uploadUrl, {
                  method: 'POST',
                  body: formData,
                  credentials: 'include',
                  headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...(campus ? { 'X-Campus': btoa(encodeURIComponent(campus)) } : {}),
                  },
                })

                uploadedImagesCount++
                message.loading(`正在上传图片... (${uploadedImagesCount}/${totalImagesCount})`, 0)

                if (response.ok) {
                  const result = await response.json()
                  if (result.success && result.file_url) {
                    recordsWithUploadedImages.push({ ...record, avatar: result.file_url })
                  } else {
                    recordsWithUploadedImages.push({ ...record, avatar: '' })
                  }
                } else {
                  recordsWithUploadedImages.push({ ...record, avatar: '' })
                }
              } catch (error) {
                console.error('上传图片失败:', error)
                recordsWithUploadedImages.push({ ...record, avatar: '' })
              }
            } else {
              recordsWithUploadedImages.push(record)
            }
          }

          // 合并现有数据
          const existingData = dataByCampus[campusName] || []
          const mergedList = [...existingData, ...recordsWithUploadedImages].map((r, idx) => ({
            ...r,
            index: idx + 1,
          }))

          // 保存到服务器
          const rows = mergedList.map((r) => ({
            inchargeInside: r.inchargeInside,
            inchargeOutside: r.inchargeOutside,
            platform: r.platform,
            accountId: r.accountId,
            nickname: r.nickname,
            avatar: r.avatar,
            remark: r.remark || '',
          }))

          const response = await apiService.post('/market/account-sentiment/bulk-save', {
            campus_name: campusName,
            rows,
          })

          const resData = response as any
          const items = resData?.items || []
          const normalized = items.map((r: any, idx: number) => ({
            id: r.id,
            index: idx + 1,
            inchargeInside: r.inchargeInside || '',
            inchargeOutside: r.inchargeOutside || '',
            platform: r.platform || '',
            accountId: r.accountId || '',
            nickname: r.nickname || '',
            avatar: r.avatar || '',
            remark: r.remark || '',
          }))

          // 更新状态
          setDataByCampus((prev) => ({
            ...prev,
            [campusName]: normalized,
          }))

          savedSheets.push(`${sheetName}(${campusName})`)
        } catch (error) {
          console.error(`保存工作表 "${sheetName}" 失败:`, error)
          failedSheets.push(sheetName)
        }
      }

      message.destroy()
      
      // 显示导入结果
      if (savedSheets.length > 0) {
        const successMsg = `成功导入 ${savedSheets.length} 个工作表，共 ${totalRecordsCount} 条记录${totalImagesCount > 0 ? `，上传了 ${uploadedImagesCount} 张图片` : ''}`
        const detailMsg = `已导入: ${savedSheets.join('、')}`
        
        if (failedSheets.length > 0) {
          modal.info({
            title: '导入完成',
            content: (
              <div>
                <p>{successMsg}</p>
                <p>{detailMsg}</p>
                <p style={{ color: '#ff4d4f' }}>失败: {failedSheets.join('、')}</p>
              </div>
            ),
          })
        } else {
          message.success(successMsg)
          message.info(detailMsg, 5)
        }
      } else {
        message.error('所有工作表导入失败')
      }

      setDirty(false)
      return false // 阻止默认上传行为
    } catch (error) {
      console.error('导入失败:', error)
      message.destroy()
      message.error(`导入失败: ${error instanceof Error ? error.message : '请检查Excel文件格式是否正确'}`)
      return false
    } finally {
      setImporting(false)
    }
  }

  const columns: ColumnsType<AccountRecord> = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 70,
      align: 'center' as const,
    },
    {
      title: '维护在编老师',
      dataIndex: 'inchargeInside',
      width: 140,
      render: (_, record) => (
        <Input
          value={record.inchargeInside}
          onChange={(e) => updateCell(record.id, 'inchargeInside', e.target.value)}
          placeholder="请输入"
        />
      ),
    },
    {
      title: '维护编外老师',
      dataIndex: 'inchargeOutside',
      width: 140,
      render: (_, record) => (
        <Input
          value={record.inchargeOutside}
          onChange={(e) => updateCell(record.id, 'inchargeOutside', e.target.value)}
          placeholder="请输入"
        />
      ),
    },
    {
      title: '新媒体平台',
      dataIndex: 'platform',
      width: 140,
      render: (_, record) => (
        <Input
          value={record.platform}
          onChange={(e) => updateCell(record.id, 'platform', e.target.value)}
          placeholder="请输入"
        />
      ),
    },
    {
      title: 'ID账号',
      dataIndex: 'accountId',
      width: 160,
      render: (_, record) => (
        <Input
          value={record.accountId}
          onChange={(e) => updateCell(record.id, 'accountId', e.target.value)}
          placeholder="请输入"
        />
      ),
    },
    {
      title: '新媒体昵称',
      dataIndex: 'nickname',
      width: 200,
      render: (_, record) => (
        <Input
          value={record.nickname}
          onChange={(e) => updateCell(record.id, 'nickname', e.target.value)}
          placeholder="请输入"
        />
      ),
    },
    {
      title: '新媒体头像（截图）',
      dataIndex: 'avatar',
      width: 220,
      render: (_, record) => {
        // 上传配置
        const uploadProps: UploadProps = {
          name: 'file',
          accept: 'image/*',
          showUploadList: false,
          customRequest: async ({ file, onSuccess, onError }) => {
            const formData = new FormData()
            formData.append('file', file as File)
            formData.append('campus_name', activeCampus || '')
            formData.append('account_id', record.accountId || record.id?.toString() || '')

            try {
              const uploadUrl = buildApiUrl('/market/account-sentiment/upload')
              const response = await apiFetch(uploadUrl, {
                method: 'POST',
                body: formData,
              })

              const data = await response.json()

              if (response.ok && data.success && data.file_url) {
                updateCell(record.id, 'avatar', data.file_url)
                message.success('头像上传成功')
                onSuccess?.(data, response as unknown as XMLHttpRequest)
              } else if (response.ok) {
                message.error(data.message || '上传失败')
                onError?.(new Error(data.message || '上传失败'))
              } else {
                message.error(data.detail || `上传失败 (${response.status})`)
                onError?.(new Error(data.detail || `上传失败 (${response.status})`))
              }
            } catch (error) {
              message.error('上传失败')
              onError?.(error as Error)
            }
          },
        }

        return (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} size="small">
                上传图片
              </Button>
            </Upload>
            {record.avatar ? (
              <div>
                <Image 
                  src={getImageUrl(record.avatar)} 
                  width={60} 
                  height={60} 
                  style={{ objectFit: 'cover', cursor: 'pointer', display: 'block', marginBottom: 8 }}
                  preview={{
                    mask: '点击查看',
                  }}
                />
                <Button 
                  danger 
                  size="small" 
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteAvatar(record.id)}
                >
                  删除
                </Button>
              </div>
            ) : null}
          </Space>
        )
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 220,
      render: (_, record) => (
        <Input
          value={record.remark}
          onChange={(e) => updateCell(record.id, 'remark', e.target.value)}
          placeholder="请输入"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Button danger type="link" icon={<DeleteOutlined />} onClick={() => handleDeleteRow(record)}>
          删除
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          市场部各校新媒体账号舆情登记表
        </Title>
        <Space>
          <Upload
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={handleImportExcel}
            disabled={!activeCampus}
          >
            <Button icon={<ImportOutlined />} loading={importing} disabled={!activeCampus}>
              从Excel导入
            </Button>
          </Upload>
          <Button icon={<ReloadOutlined />} onClick={loadActiveCampusData} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRow}>
            新增一行
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={saveData} disabled={!dirty} loading={saving}>
            保存
          </Button>
        </Space>
      </div>

      <Card>
        <Tabs
          activeKey={activeCampus}
          onChange={(key) => {
            if (dirty) {
              modal.confirm({
                title: '未保存的更改',
                content: '当前神殿有未保存的更改，切换神殿会丢失更改，是否继续？',
                okText: '继续切换',
                cancelText: '取消',
                onOk: () => {
                  setDirty(false)
                  setActiveCampus(key)
                },
              })
              return
            }
            setActiveCampus(key)
          }}
          items={campuses.map((c) => ({
            key: c.name,
            label: c.name,
            children: (
              <Table
                columns={columns}
                dataSource={currentTableData}
                rowKey="id"
                pagination={false}
                bordered
                size="small"
                loading={loading}
                scroll={{ x: 1300, y: 600 }}
              />
            ),
          }))}
        />
      </Card>
    </div>
  )
}

export default AccountSentimentPage
