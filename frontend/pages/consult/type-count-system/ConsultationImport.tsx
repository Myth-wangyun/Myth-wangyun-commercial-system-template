/**
 * 咨询量导入组件
 * 支持导入口碑、渠道、网络和任意来源的咨询量
 */

import React, { useState, useCallback } from 'react'
import { App,
  Modal,
  Upload,
  Button,
  Radio,
  Table,
  Alert,
  Space,
  Typography,
  Divider,
  Progress,
  Tag,
  Tooltip,
  Card,
} from 'antd'
import {
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileExcelOutlined,
} from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import * as XLSX from 'xlsx'
import { importConsultationRecords } from './api'
import type { ImportRow, ImportConsultationResponse, ImportResultItem } from './types'
import { useAuthStore } from '@/stores/authStore'

const { Text, Title } = Typography

type SourceType = '口碑' | '渠道' | '网络' | '任意' | '旧量' | '报名旧量' | '订座旧量' | '上门旧量'

interface ConsultationImportProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
  defaultCampus?: string
}

// 口碑来源模板列
const koubeiColumns = [
  '咨询者姓名',
  '电话',
  '微信',
  '咨询师',
  '代咨',
  '口碑提供人',
  '年龄',
  '性别',
  '学历',
  '位置',
  '报名意向',
  '咨询类别',
  '来源类别',
  '具体来源',
  '关键字',
  '备注',
]

// 渠道来源模板列
const qudaoColumns = [
  '咨询者姓名',
  '电话',
  '微信',
  '咨询师',
  '代咨',
  '县办',
  '乡办',
  '信息员',
  '渠道专员',
  '年龄',
  '性别',
  '学历',
  '位置',
  '报名意向',
  '咨询类别',
  '来源类别',
  '具体来源',
  '关键字',
  '备注',
]

// 网络来源模板列
const networkColumns = [
  '咨询者姓名',
  '电话',
  '微信',
  '咨询师',
  '代咨',
  '网聊专员',
  '年龄',
  '性别',
  '学历',
  '位置',
  '报名意向',
  '咨询类别',
  '来源类别',
  '具体来源',
  '关键字',
  '备注',
]

// 任意来源模板列（包含所有可用字段）
const anyColumns = [
  '咨询者姓名',
  '电话',
  '微信',
  '量来源',
  '来源类别',
  '具体来源',
  '咨询师',
  '代咨',
  '分量人',
  '口碑提供人',
  '县办',
  '乡办',
  '信息员',
  '渠道专员',
  '网聊专员',
  '年龄',
  '性别',
  '学历',
  '状态',
  '位置',
  '报名意向',
  '咨询类别',
  '关键字',
  'QQ',
  '抖音',
  '快手',
  '就读学校',
  '目前状态',
  '地区',
  '报名专业',
  '咨询结果',
  '是否上门',
  '是否报名',
  '是否订座',
  '备注',
]

// 旧量导入模板列（用于导入历史数据，包含登记时间字段）
const oldDataColumns = [
  '咨询师',
  '咨询者',
  '年龄',
  '性别',
  '电话',
  'QQ',
  '微信',
  '学历',
  '状态',
  '位置',
  '报名意向',
  '量来源',
  '来源类别',
  '细分媒体',
  '关键字',
  '登记时间',
  '代咨',
  '网聊专员',
  '口碑提供人',
  '县办',
  '乡办',
  '信息员',
  '渠道专员',
]

// 报名旧量导入模板列（在旧量基础上增加报名相关字段）
const baomingOldDataColumns = [
  '咨询师',
  '咨询者',
  '年龄',
  '性别',
  '电话',
  'QQ',
  '微信',
  '学历',
  '状态',
  '位置',
  '报名意向',
  '量来源',
  '来源类别',
  '细分媒体',
  '关键字',
  '登记时间',
  '代咨',
  '网聊专员',
  '口碑提供人',
  '县办',
  '乡办',
  '信息员',
  '渠道专员',
  '报名时间',
  '长期短期',
  '课程',
  '全款',
  '分期',
  '分期备注',
  '注册',
  '贷款',
  '已交学费',
  '缴费金额',
  '详细地址',
  '报名专业',
]

// 订座旧量导入模板列（在旧量基础上增加订座相关字段）
const dingzuoOldDataColumns = [
  '咨询师',
  '咨询者',
  '年龄',
  '性别',
  '电话',
  'QQ',
  '微信',
  '学历',
  '状态',
  '位置',
  '报名意向',
  '量来源',
  '来源类别',
  '细分媒体',
  '关键字',
  '登记时间',
  '代咨',
  '网聊专员',
  '口碑提供人',
  '县办',
  '乡办',
  '信息员',
  '渠道专员',
  '订座时间',
  '订座金额',
  '缴费金额',
  '已交学费',
]

// 上门旧量导入模板列（在旧量基础上增加上门相关字段）
const shangmenOldDataColumns = [
  '咨询师',
  '咨询者',
  '年龄',
  '性别',
  '电话',
  'QQ',
  '微信',
  '学历',
  '状态',
  '位置',
  '报名意向',
  '量来源',
  '来源类别',
  '细分媒体',
  '关键字',
  '登记时间',
  '网聊专员',
  '口碑提供人',
  '县办',
  '乡办',
  '信息员',
  '渠道专员',
  '上门时间',
  '代咨',
  '网转上门',
  '口碑上门',
  '渠道上门',
  '校园新渠道',
  '新媒体来源',
  '网络新媒体',
]

const getTemplateColumns = (sourceType: SourceType): string[] => {
  switch (sourceType) {
    case '口碑': return koubeiColumns
    case '渠道': return qudaoColumns
    case '网络': return networkColumns
    case '任意': return anyColumns
    case '旧量': return oldDataColumns
    case '报名旧量': return baomingOldDataColumns
    case '订座旧量': return dingzuoOldDataColumns
    case '上门旧量': return shangmenOldDataColumns
  }
}

const ConsultationImport: React.FC<ConsultationImportProps> = ({
  visible,
  onClose,
  onSuccess,
  defaultCampus,
}) => {
  const { message, modal } = App.useApp()
  const refreshUserInfo = useAuthStore((state) => state.refreshUserInfo)
  const [sourceType, setSourceType] = useState<SourceType>('口碑')
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [parsedData, setParsedData] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportConsultationResponse | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')

  // 重置状态
  const resetState = useCallback(() => {
    setFileList([])
    setParsedData([])
    setImportResult(null)
    setStep('upload')
  }, [])

  // 关闭弹窗
  const handleClose = () => {
    resetState()
    onClose()
  }

  // 下载模板
  const handleDownloadTemplate = () => {
    const columns = getTemplateColumns(sourceType)
    const ws = XLSX.utils.aoa_to_sheet([columns])
    
    // 设置列宽
    ws['!cols'] = columns.map(() => ({ wch: 15 }))
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '咨询量导入模板')
    
    const labelMap: Record<SourceType, string> = {
      '口碑': '口碑来源',
      '渠道': '渠道来源',
      '网络': '网络来源',
      '任意': '通用',
      '旧量': '旧量导入',
      '报名旧量': '报名旧量导入',
      '订座旧量': '订座旧量导入',
      '上门旧量': '上门旧量导入',
    }
    
    XLSX.writeFile(wb, `咨询量导入模板_${labelMap[sourceType]}.xlsx`)
    message.success('模板下载成功')
  }

  // 解析Excel文件
  const parseExcelFile = (file: File): Promise<ImportRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary', cellDates: true })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // 转换为JSON，使用第一行作为header
          // raw: true 保留原始值（日期为Date对象），后续手动处理
          const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
            raw: true,
            defval: '',
          })
          
          // 辅助函数：将Excel/JS值转为字符串（处理Date对象、数字等）
          const toStr = (val: any): string | null => {
            if (val === null || val === undefined || val === '') return null
            if (val instanceof Date) {
              // Date对象（cellDates=true时Excel日期列产生）→ 格式化为 YYYY-MM-DD HH:mm:ss
              const yyyy = val.getFullYear()
              const MM = String(val.getMonth() + 1).padStart(2, '0')
              const dd = String(val.getDate()).padStart(2, '0')
              const hh = String(val.getHours()).padStart(2, '0')
              const mm = String(val.getMinutes()).padStart(2, '0')
              const ss = String(val.getSeconds()).padStart(2, '0')
              return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`
            }
            return String(val).trim() || null
          }

          // 辅助函数：解析旧量系列基础字段（旧量/报名旧量/订座旧量/上门旧量共用）
          const parseOldDataBaseRow = (row: Record<string, any>): ImportRow => {
            const dateStr = toStr(row['登记时间'])
            return {
              旧量日期: dateStr,
              咨询师: toStr(row['咨询师']),
              咨询者姓名: toStr(row['咨询者']),
              年龄: toStr(row['年龄']),
              性别: toStr(row['性别']),
              电话: toStr(row['电话']),
              QQ: toStr(row['QQ']),
              微信: toStr(row['微信']),
              学历: toStr(row['学历']),
              状态: toStr(row['状态']),
              位置: toStr(row['位置']),
              报名意向: (() => {
                const v = toStr(row['报名意向'])?.toUpperCase();
                const abcdMap: Record<string, string> = { 'A': '强意向', 'B': '中意向', 'C': '弱意向', 'D': '无意向' };
                return abcdMap[v || ''] || toStr(row['报名意向']);
              })(),
              量来源: (() => {
                const src = toStr(row['量来源']);
                const srcMap: Record<string, string> = { '百度': '网络', '其他网络': '网络', '其它网络': '网络' };
                return srcMap[src || ''] || src;
              })(),
              来源类别: (() => {
                const src = toStr(row['量来源']);
                const categoryMap: Record<string, string> = { '百度': '常规SEM平台', '其他网络': '新媒体平台', '其它网络': '新媒体平台' };
                return toStr(row['来源类别']) || categoryMap[src || ''] || null;
              })(),
              具体来源: (() => {
                const src = toStr(row['量来源']);
                const categoryMap: Record<string, string> = { '百度': '常规SEM平台', '其他网络': '新媒体平台', '其它网络': '新媒体平台' };
                const fallback = categoryMap[src || ''] || null;
                return toStr(row['细分媒体']) || toStr(row['具体来源']) || toStr(row['媒体来源']) || fallback;
              })(),
              关键字: toStr(row['关键字']),
              网聊专员: toStr(row['网聊专员']),
              口碑提供人: toStr(row['口碑提供人']),
              县办: toStr(row['县办']),
              乡办: toStr(row['乡办']),
              信息员: toStr(row['信息员']),
              渠道专员: toStr(row['渠道专员']),
              已交学费: toStr(row['已交学费']),
              代咨: toStr(row['代咨']),
            }
          }

          // 辅助函数：安全解析整数
          const toInt = (val: any): number | null => {
            if (val === null || val === undefined || val === '') return null
            const n = parseInt(String(val), 10)
            return isNaN(n) ? null : n
          }

          // 映射数据
          const mappedData: ImportRow[] = jsonData.map((row) => {
            // 旧量系列导入模式：字段名与标准不同，需要特殊映射
            if (sourceType === '旧量') {
              return parseOldDataBaseRow(row)
            }
            
            if (sourceType === '报名旧量') {
              const base = parseOldDataBaseRow(row)
              return {
                ...base,
                是否报名: 1,
                报名时间: toStr(row['报名时间']),
                长期短期: toStr(row['长期短期']),
                课程: toStr(row['课程']),
                全款: toInt(row['全款']),
                分期: toInt(row['分期']),
                分期备注: toStr(row['分期备注']),
                注册: toInt(row['注册']),
                贷款: toInt(row['贷款']),
                缴费金额: toInt(row['缴费金额']),
                详细地址: toStr(row['详细地址']),
                报名专业: toStr(row['报名专业']),
              } as ImportRow
            }
            
            if (sourceType === '订座旧量') {
              const base = parseOldDataBaseRow(row)
              return {
                ...base,
                是否订座: 1,
                订座时间: toStr(row['订座时间']),
                订座金额: toInt(row['订座金额']),
                缴费金额: toInt(row['缴费金额']),
              } as ImportRow
            }
            
            if (sourceType === '上门旧量') {
              const base = parseOldDataBaseRow(row)
              return {
                ...base,
                是否上门: 1,
                上门时间: toStr(row['上门时间']),
                代咨: toStr(row['代咨']),
                网转上门: toInt(row['网转上门']),
                口碑上门: toInt(row['口碑上门']),
                渠道上门: toInt(row['渠道上门']),
                校园新渠道: toInt(row['校园新渠道']),
                新媒体来源: toInt(row['新媒体来源']),
                网络新媒体: toInt(row['网络新媒体']),
              } as ImportRow
            }
            
            const baseRow: ImportRow = {
              咨询者姓名: toStr(row['咨询者姓名']),
              电话: toStr(row['电话']),
              微信: toStr(row['微信']),
              咨询师: toStr(row['咨询师']),
              口碑提供人: toStr(row['口碑提供人']),
              渠道专员: toStr(row['渠道专员']),
              县办: toStr(row['县办']),
              乡办: toStr(row['乡办']),
              信息员: toStr(row['信息员']),
              网聊专员: toStr(row['网聊专员']),
              年龄: toStr(row['年龄']),
              性别: toStr(row['性别']),
              学历: toStr(row['学历']),
              位置: toStr(row['位置']),
              报名意向: toStr(row['报名意向']),
              咨询类别: toStr(row['咨询类别']),
              来源类别: toStr(row['来源类别']),
              具体来源: toStr(row['具体来源']),
              关键字: toStr(row['关键字']),
              代咨: toStr(row['代咨']),
              备注: toStr(row['备注']),
            }
            
            // 任意导入模式额外字段
            if (sourceType === '任意') {
              baseRow.量来源 = toStr(row['量来源'])
              baseRow.分量人 = toStr(row['分量人'])
              baseRow.状态 = toStr(row['状态'])
              baseRow.QQ = toStr(row['QQ'])
              baseRow.抖音 = toStr(row['抖音'])
              baseRow.快手 = toStr(row['快手'])
              baseRow.就读学校 = toStr(row['就读学校'])
              baseRow.目前状态 = toStr(row['目前状态'])
              baseRow.地区 = toStr(row['地区'])
              baseRow.报名专业 = toStr(row['报名专业'])
              baseRow.咨询结果 = toStr(row['咨询结果'])
              baseRow.是否上门 = row['是否上门'] ? parseInt(String(row['是否上门'])) : null
              baseRow.是否报名 = row['是否报名'] ? parseInt(String(row['是否报名'])) : null
              baseRow.是否订座 = row['是否订座'] ? parseInt(String(row['是否订座'])) : null
            }
            
            return baseRow
          })
          
          // 过滤掉空行
          const isOldDataType = ['旧量', '报名旧量', '订座旧量', '上门旧量'].includes(sourceType)
          const filteredData = mappedData.filter((row) => {
            if (isOldDataType) {
              // 旧量系列导入：电话或微信至少填一个
              return row.电话 || row.微信
            }
            return row.电话 || row.微信
          })
          
          resolve(filteredData)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsBinaryString(file)
    })
  }

  // 上传配置
  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls',
    maxCount: 1,
    fileList,
    beforeUpload: async (file) => {
      try {
        const data = await parseExcelFile(file)
        if (data.length === 0) {
          message.error('文件中没有有效数据，请检查格式')
          return Upload.LIST_IGNORE
        }
        
        setParsedData(data)
        setFileList([file as unknown as UploadFile])
        setStep('preview')
        message.success(`成功解析 ${data.length} 条数据`)
      } catch (error) {
        message.error('文件解析失败，请检查文件格式')
      }
      return false
    },
    onRemove: () => {
      resetState()
    },
  }

  // 执行导入
  const handleImport = async () => {
    if (parsedData.length === 0) {
      message.error('没有可导入的数据')
      return
    }

    setImporting(true)
    try {
      await refreshUserInfo()
      const latestUser = useAuthStore.getState().user
      if (!latestUser) {
        message.error('登录信息已失效，请重新登录后导入')
        return
      }
      const result = await importConsultationRecords({
        量来源: sourceType,
        数据列表: parsedData,
        神殿: defaultCampus,
        导入人ID: Number(latestUser.id),
        导入人姓名: latestUser.name,
      })
      
      setImportResult(result)
      setStep('result')
      
      if (result.成功数量 > 0) {
        message.success(`成功导入 ${result.成功数量} 条数据`)
        onSuccess()
      }
      
      if (result.失败数量 > 0) {
        message.warning(`${result.失败数量} 条数据导入失败`)
      }
    } catch (error: any) {
      const status = error?.response?.status
      const data = error?.response?.data
      const detail = data?.detail
      if (status === 401 && detail?.code === 'IMPORT_USER_MISMATCH') {
        const expected = detail?.expected_user
        modal.confirm({
          title: '登录用户已变更',
          content: `检测到当前登录人已变更为 ${expected?.real_name || '未知用户'}，是否使用该账号继续导入？`,
          okText: '继续导入',
          cancelText: '取消',
          onOk: async () => {
            try {
              await refreshUserInfo()
              const latest = useAuthStore.getState().user
              if (!latest) {
                message.error('登录信息已失效，请重新登录后导入')
                return
              }
              setImporting(true)
              const retryResult = await importConsultationRecords({
                量来源: sourceType,
                数据列表: parsedData,
                神殿: defaultCampus,
                导入人ID: Number(latest.id),
                导入人姓名: latest.name,
              })
              setImportResult(retryResult)
              setStep('result')
              if (retryResult.成功数量 > 0) {
                message.success(`成功导入 ${retryResult.成功数量} 条数据`)
                onSuccess()
              }
              if (retryResult.失败数量 > 0) {
                message.warning(`${retryResult.失败数量} 条数据导入失败`)
              }
            } catch (retryError: any) {
              message.error(`导入失败: ${retryError?.message || '未知错误'}`)
            } finally {
              setImporting(false)
            }
          },
        })
        return
      }
      // 超时错误特殊处理
      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        message.error('导入请求超时，但数据可能仍在后台处理中。请稍后刷新页面查看数据是否导入成功。', 8)
      } else {
        message.error(`导入失败: ${error.message || '未知错误'}`)
      }
    } finally {
      setImporting(false)
    }
  }

  // 预览表格列 - 根据导入类型动态生成
  const previewColumns = (() => {
    const baseCols = [
      { title: '序号', dataIndex: 'index', key: 'index', width: 60 },
      { title: '姓名', dataIndex: '咨询者姓名', key: '咨询者姓名', width: 80 },
      { title: '电话', dataIndex: '电话', key: '电话', width: 120 },
      { title: '微信', dataIndex: '微信', key: '微信', width: 100 },
      { title: '咨询师', dataIndex: '咨询师', key: '咨询师', width: 80 },
    ]
    
    const sourceSpecific: Record<SourceType, any[]> = {
      '口碑': [
        { title: '口碑提供人', dataIndex: '口碑提供人', key: '口碑提供人', width: 100 },
      ],
      '渠道': [
        { title: '县办', dataIndex: '县办', key: '县办', width: 100 },
        { title: '乡办', dataIndex: '乡办', key: '乡办', width: 100 },
        { title: '信息员', dataIndex: '信息员', key: '信息员', width: 100 },
        { title: '渠道专员', dataIndex: '渠道专员', key: '渠道专员', width: 100 },
      ],
      '网络': [
        { title: '网聊专员', dataIndex: '网聊专员', key: '网聊专员', width: 100 },
      ],
      '任意': [
        { title: '量来源', dataIndex: '量来源', key: '量来源', width: 80 },
        { title: '分量人', dataIndex: '分量人', key: '分量人', width: 80 },
      ],
      '旧量': [
        { title: '登记时间', dataIndex: '旧量日期', key: '旧量日期', width: 140 },
        { title: '量来源', dataIndex: '量来源', key: '量来源', width: 80 },
        { title: '来源类别', dataIndex: '来源类别', key: '来源类别', width: 100 },
        { title: '细分媒体', dataIndex: '具体来源', key: '具体来源', width: 120 },
        { title: '网聊专员', dataIndex: '网聊专员', key: '网聊专员', width: 80 },
        { title: '县办', dataIndex: '县办', key: '县办', width: 80 },
        { title: '乡办', dataIndex: '乡办', key: '乡办', width: 80 },
        { title: '信息员', dataIndex: '信息员', key: '信息员', width: 80 },
      ],
      '报名旧量': [
        { title: '登记时间', dataIndex: '旧量日期', key: '旧量日期', width: 140 },
        { title: '量来源', dataIndex: '量来源', key: '量来源', width: 80 },
        { title: '报名时间', dataIndex: '报名时间', key: '报名时间', width: 140 },
        { title: '长期短期', dataIndex: '长期短期', key: '长期短期', width: 80 },
        { title: '课程', dataIndex: '课程', key: '课程', width: 100 },
        { title: '缴费金额', dataIndex: '缴费金额', key: '缴费金额', width: 80 },
        { title: '全款', dataIndex: '全款', key: '全款', width: 60 },
        { title: '分期', dataIndex: '分期', key: '分期', width: 60 },
      ],
      '订座旧量': [
        { title: '登记时间', dataIndex: '旧量日期', key: '旧量日期', width: 140 },
        { title: '量来源', dataIndex: '量来源', key: '量来源', width: 80 },
        { title: '订座时间', dataIndex: '订座时间', key: '订座时间', width: 140 },
        { title: '订座金额', dataIndex: '订座金额', key: '订座金额', width: 80 },
        { title: '缴费金额', dataIndex: '缴费金额', key: '缴费金额', width: 80 },
        { title: '已交学费', dataIndex: '已交学费', key: '已交学费', width: 80 },
      ],
      '上门旧量': [
        { title: '登记时间', dataIndex: '旧量日期', key: '旧量日期', width: 140 },
        { title: '量来源', dataIndex: '量来源', key: '量来源', width: 80 },
        { title: '上门时间', dataIndex: '上门时间', key: '上门时间', width: 140 },
        { title: '代咨', dataIndex: '代咨', key: '代咨', width: 80 },
        { title: '网转上门', dataIndex: '网转上门', key: '网转上门', width: 80 },
        { title: '口碑上门', dataIndex: '口碑上门', key: '口碑上门', width: 80 },
        { title: '渠道上门', dataIndex: '渠道上门', key: '渠道上门', width: 80 },
      ],
    }
    
    const tailCols = [
      { title: '报名意向', dataIndex: '报名意向', key: '报名意向', width: 100 },
      { title: '关键字', dataIndex: '关键字', key: '关键字', width: 150 },
    ]
    
    return [...baseCols, ...sourceSpecific[sourceType], ...tailCols]
  })()

  // 结果表格列
  const resultColumns = [
    { title: '行号', dataIndex: '行号', key: '行号', width: 60 },
    {
      title: '状态',
      dataIndex: '成功',
      key: '成功',
      width: 80,
      render: (success: boolean, record: ImportResultItem) => (
        <Space>
          {success ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              {record.是否重量 ? '重量' : '成功'}
            </Tag>
          ) : (
            <Tag color="error" icon={<CloseCircleOutlined />}>失败</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '消息',
      dataIndex: '消息',
      key: '消息',
      render: (text: string) => (
        <Tooltip title={text}>
          <Text ellipsis style={{ maxWidth: 300 }}>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: '记录ID',
      dataIndex: '记录ID',
      key: '记录ID',
      width: 80,
      render: (id: number | null) => id || '-',
    },
  ]

  // 渲染上传步骤
  const renderUploadStep = () => (
    <div>
      <Alert
        message="导入说明"
        description={
          <div>
            <p>1. 请先下载对应的导入模板，按模板格式填写数据</p>
            <p>2. <strong>电话</strong> 和 <strong>微信</strong> 至少填写一项{['旧量', '报名旧量', '订座旧量', '上门旧量'].includes(sourceType) ? '（旧量导入需填写日期）' : ''}</p>
            <p>3. 所有导入类型都支持填写<strong>咨询师</strong>，可在导入时直接分配</p>
            {sourceType === '口碑' && <p>4. 口碑来源建议填写 <strong>口碑提供人</strong></p>}
            {sourceType === '渠道' && <p>4. 渠道来源建议填写 <strong>县办</strong>、<strong>乡办</strong>、<strong>信息员</strong> 和 <strong>渠道专员</strong></p>}
            {sourceType === '网络' && <p>4. 网络来源建议填写 <strong>网聊专员</strong></p>}
            {sourceType === '旧量' && (
              <>
                <p>4. 旧量导入用于导入历史数据，<strong>登记时间</strong>按Excel中的日期显示（缺失时自动用系统时间）</p>
                <p>5. 支持 Excel 日期格式和文本日期（如 2025/12/31 17:47、2025-12-31 等）</p>
              </>
            )}
            {sourceType === '报名旧量' && (
              <>
                <p>4. 报名旧量导入用于导入历史<strong>已报名</strong>数据，自动标记<strong>是否报名=是</strong></p>
                <p>5. 支持导入报名时间、长期/短期、课程、全款/分期、缴费金额等报名字段</p>
                <p>6. <strong>报名时间</strong>留空时自动使用登记时间</p>
              </>
            )}
            {sourceType === '订座旧量' && (
              <>
                <p>4. 订座旧量导入用于导入历史<strong>已订座</strong>数据，自动标记<strong>是否订座=是</strong></p>
                <p>5. 支持导入订座时间、订座金额、缴费金额等订座字段</p>
                <p>6. <strong>订座时间</strong>留空时自动使用登记时间</p>
              </>
            )}
            {sourceType === '上门旧量' && (
              <>
                <p>4. 上门旧量导入用于导入历史<strong>已上门</strong>数据，自动标记<strong>是否上门=是</strong></p>
                <p>5. 支持导入上门时间、代咨、网转上门、口碑上门、渠道上门等上门统计字段</p>
                <p>6. <strong>上门时间</strong>留空时自动使用登记时间</p>
              </>
            )}
            {sourceType === '任意' && (
              <>
                <p>4. 任意导入模式支持<strong>所有字段</strong>，可自由指定量来源、分量人等</p>
                <p>5. 如果填写了<strong>量来源</strong>列，每行记录会按照指定的量来源导入</p>
              </>
            )}
            <p>{['任意', '旧量', '报名旧量', '订座旧量', '上门旧量'].includes(sourceType) ? '7' : '4'}. 系统会自动检测重量，重复的电话会关联到已有咨询对象</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <div style={{ marginBottom: 24 }}>
        <Text strong>选择导入类型：</Text>
        <div style={{ marginTop: 8 }}>
          <Radio.Group
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
          >
            <Radio.Button value="口碑">口碑来源</Radio.Button>
            <Radio.Button value="渠道">渠道来源</Radio.Button>
            <Radio.Button value="网络">网络来源</Radio.Button>
            <Radio.Button value="任意">任意导入</Radio.Button>
            <Radio.Button value="旧量">旧量导入</Radio.Button>
            <Radio.Button value="报名旧量">报名旧量</Radio.Button>
            <Radio.Button value="订座旧量">订座旧量</Radio.Button>
            <Radio.Button value="上门旧量">上门旧量</Radio.Button>
          </Radio.Group>
        </div>
      </div>
      
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<DownloadOutlined />}
          onClick={handleDownloadTemplate}
          style={{ marginRight: 16 }}
        >
          下载{{
            '口碑': '口碑来源', '渠道': '渠道来源', '网络': '网络来源',
            '任意': '通用', '旧量': '旧量导入',
            '报名旧量': '报名旧量导入', '订座旧量': '订座旧量导入', '上门旧量': '上门旧量导入',
          }[sourceType]}模板
        </Button>
      </div>
      
      <Divider />
      
      <Upload.Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <FileExcelOutlined style={{ fontSize: 48, color: '#52c41a' }} />
        </p>
        <p className="ant-upload-text">点击或拖拽Excel文件到此处</p>
        <p className="ant-upload-hint">支持 .xlsx, .xls 格式</p>
      </Upload.Dragger>
    </div>
  )

  // 渲染预览步骤
  const renderPreviewStep = () => (
    <div>
      <Alert
        message={`已解析 ${parsedData.length} 条数据，请确认后导入`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Text>导入类型：</Text>
          <Tag color={
            sourceType === '口碑' ? 'blue' : 
            sourceType === '渠道' ? 'green' : 
            sourceType === '网络' ? 'purple' : 
            sourceType === '旧量' ? 'red' :
            sourceType === '报名旧量' ? 'magenta' :
            sourceType === '订座旧量' ? 'volcano' :
            sourceType === '上门旧量' ? 'cyan' :
            'orange'
          }>
            {{
              '口碑': '口碑来源', '渠道': '渠道来源', '网络': '网络来源',
              '任意': '任意导入', '旧量': '旧量导入',
              '报名旧量': '报名旧量导入', '订座旧量': '订座旧量导入', '上门旧量': '上门旧量导入',
            }[sourceType]}
          </Tag>
          <Text>数据量：</Text>
          <Text strong>{parsedData.length} 条</Text>
        </Space>
      </Card>
      
      <Table
        dataSource={parsedData.map((item, index) => ({ ...item, index: index + 1, key: index }))}
        columns={previewColumns}
        size="small"
        scroll={{ x: 900, y: 300 }}
        pagination={{ pageSize: 50, showSizeChanger: false }}
      />
      
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Space>
          <Button onClick={() => { resetState() }}>重新选择</Button>
          <Button type="primary" onClick={handleImport} loading={importing}>
            确认导入
          </Button>
        </Space>
      </div>
    </div>
  )

  // 渲染结果步骤
  const renderResultStep = () => {
    if (!importResult) return null
    
    const { 成功数量, 失败数量, 重量数量, 结果列表 } = importResult
    const total = 成功数量 + 失败数量
    const successRate = total > 0 ? Math.round((成功数量 / total) * 100) : 0
    
    return (
      <div>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <Title level={2} style={{ color: '#52c41a', margin: 0 }}>{成功数量}</Title>
              <Text type="secondary">成功导入</Text>
            </div>
            <div>
              <Title level={2} style={{ color: '#faad14', margin: 0 }}>{重量数量}</Title>
              <Text type="secondary">重量记录</Text>
            </div>
            <div>
              <Title level={2} style={{ color: '#ff4d4f', margin: 0 }}>{失败数量}</Title>
              <Text type="secondary">导入失败</Text>
            </div>
          </div>
          <Divider />
          <Progress
            percent={successRate}
            status={失败数量 > 0 ? 'exception' : 'success'}
            format={() => `成功率 ${successRate}%`}
          />
        </Card>
        
        {失败数量 > 0 && (
          <Alert
            message="部分数据导入失败"
            description="请查看下方失败原因，修正后重新导入"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Table
          dataSource={结果列表.map((item, index) => ({ ...item, key: index }))}
          columns={resultColumns}
          size="small"
          scroll={{ y: 300 }}
          pagination={{ pageSize: 50, showSizeChanger: false }}
        />
        
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button onClick={resetState}>继续导入</Button>
            <Button type="primary" onClick={handleClose}>完成</Button>
          </Space>
        </div>
      </div>
    )
  }

  return (
    <Modal
      title={
        <Space>
          <FileExcelOutlined />
          <span>咨询量导入</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={900}
      footer={null}
      destroyOnClose
    >
      {step === 'upload' && renderUploadStep()}
      {step === 'preview' && renderPreviewStep()}
      {step === 'result' && renderResultStep()}
    </Modal>
  )
}

export default ConsultationImport
