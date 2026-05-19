/**
 * 神殿教化司个人企业签约目标与结果汇总表主页面
 */

import React, { useState, useEffect } from 'react'
import { App, Card, Space, Select } from 'antd'
import PersonalContractSigningTable from './components/PersonalContractSigningTable'
import type { PersonalContractSigningRecord } from '@/types/personal-contract-signing'
import { personalContractSigningService } from '@/services/personalContractSigning'

const PersonalContractSigningPage: React.FC = () => {
  const { message } = App.useApp()
  const [data, setData] = useState<PersonalContractSigningRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<string>('all')
  const [personOptions, setPersonOptions] = useState<Array<{ label: string; value: string }>>([])

  // 获取数据
  const fetchData = async (personName?: string) => {
    setLoading(true)
    try {
      const result = await personalContractSigningService.getPersonalContractSigningData(personName)
      setData(result)
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取可选人员列表
  const loadPersonOptions = async () => {
    try {
      const names = await personalContractSigningService.getAvailablePersonNames()
      setPersonOptions([
        { label: '全部', value: 'all' },
        ...names.map((name) => ({ label: name, value: name })),
      ])
    } catch (error) {
      message.error('获取人员列表失败')
    }
  }

  // 初始化
  useEffect(() => {
    loadPersonOptions()
    fetchData()
  }, [])

  // 筛选变化时重新获取数据
  useEffect(() => {
    const personName = selectedPerson === 'all' ? undefined : selectedPerson
    fetchData(personName)
  }, [selectedPerson])

  // 刷新数据
  const handleRefresh = () => {
    const personName = selectedPerson === 'all' ? undefined : selectedPerson
    fetchData(personName)
  }

  // 导出数据
  const handleExport = () => {
    // 导出功能在表格组件中实现
  }

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span style={{ fontWeight: 500 }}>筛选个人：</span>
          <Select
            value={selectedPerson}
            onChange={setSelectedPerson}
            placeholder="请选择个人"
            style={{ width: 200 }}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={personOptions}
          />
        </Space>
      </Card>

      <PersonalContractSigningTable
        data={data}
        loading={loading}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />
    </div>
  )
}

export default PersonalContractSigningPage
