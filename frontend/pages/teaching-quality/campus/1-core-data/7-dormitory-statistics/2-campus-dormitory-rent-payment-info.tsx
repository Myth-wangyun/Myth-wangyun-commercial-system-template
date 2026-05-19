import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { App, Card, Table, Input, InputNumber, Space, Button } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { buildApiUrl } from '@/utils/apiBase'

interface DormitoryRentRow {
  key: string
  serialNumber: number
  dormShortName: string
  address: string
  landlordName: string
  landlordPhone: string
  area: string
  leaseTerm: string
  paymentMethod: string
  rentAmount: number
  deposit: number
  payeeInfo: string
  electricMeterNo: string
  heatingCardNo: string
  waterCard: string
  heatingPayMethod: string
  heatingPayAmount: number
  // 首租
  firstRentAmount: number
  firstRentPeriod: string
  // 1-12月
  janRentAmount: number
  janRentPeriod: string
  febRentAmount: number
  febRentPeriod: string
  marRentAmount: number
  marRentPeriod: string
  aprRentAmount: number
  aprRentPeriod: string
  mayRentAmount: number
  mayRentPeriod: string
  junRentAmount: number
  junRentPeriod: string
  julRentAmount: number
  julRentPeriod: string
  augRentAmount: number
  augRentPeriod: string
  sepRentAmount: number
  sepRentPeriod: string
  octRentAmount: number
  octRentPeriod: string
  novRentAmount: number
  novRentPeriod: string
  decRentAmount: number
  decRentPeriod: string
  otherMonths: string
  originalStatus: string
  signer: string
  dormManager: string
  remarks: string
}

const createInitialRows = (): DormitoryRentRow[] =>
  Array.from({ length: 28 }, (_, idx) => {
    const serial = idx + 1
    return {
      key: String(serial),
      serialNumber: serial,
      dormShortName: '',
      address: '',
      landlordName: '',
      landlordPhone: '',
      area: '',
      leaseTerm: '',
      paymentMethod: '',
      rentAmount: 0,
      deposit: 0,
      payeeInfo: '',
      electricMeterNo: '',
      heatingCardNo: '',
      waterCard: '',
      heatingPayMethod: '',
      heatingPayAmount: 0,
      firstRentAmount: 0,
      firstRentPeriod: '',
      janRentAmount: 0,
      janRentPeriod: '',
      febRentAmount: 0,
      febRentPeriod: '',
      marRentAmount: 0,
      marRentPeriod: '',
      aprRentAmount: 0,
      aprRentPeriod: '',
      mayRentAmount: 0,
      mayRentPeriod: '',
      junRentAmount: 0,
      junRentPeriod: '',
      julRentAmount: 0,
      julRentPeriod: '',
      augRentAmount: 0,
      augRentPeriod: '',
      sepRentAmount: 0,
      sepRentPeriod: '',
      octRentAmount: 0,
      octRentPeriod: '',
      novRentAmount: 0,
      novRentPeriod: '',
      decRentAmount: 0,
      decRentPeriod: '',
      otherMonths: '',
      originalStatus: '',
      signer: '',
      dormManager: '',
      remarks: '',
    }
  })

const DormitoryRentPaymentInfoTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  // 默认不渲染 28 行空数据，首屏仅展示真正有数据的行，优化打开速度
  const [rows, setRows] = useState<DormitoryRentRow[]>([])

  const canIO = useMemo(() => Boolean(currentCampus && year), [currentCampus, year])

  const handleTextChange = useCallback(
    (key: string, field: keyof DormitoryRentRow, value: string) => {
      setRows((prev) =>
        prev.map((row) =>
          row.key === key
            ? {
                ...row,
                [field]: value,
              }
            : row,
        ),
      )
    },
    [],
  )

  const handleNumberChange = useCallback(
    (
      key: string,
      field: keyof Pick<DormitoryRentRow, 'rentAmount' | 'deposit' | 'heatingPayAmount' | 'firstRentAmount' | 'janRentAmount' | 'febRentAmount' | 'marRentAmount' | 'aprRentAmount' | 'mayRentAmount' | 'junRentAmount' | 'julRentAmount' | 'augRentAmount' | 'sepRentAmount' | 'octRentAmount' | 'novRentAmount' | 'decRentAmount'>,
      value: number | null,
    ) => {
      const v = typeof value === 'number' ? value : 0
      setRows((prev) =>
        prev.map((row) =>
          row.key === key
            ? {
                ...row,
                [field]: v,
              }
            : row,
        ),
      )
    },
    [],
  )

  const handleAddRow = () => {
    setRows((prev) => {
      // 找到当前最大的序号
      const maxSerialNumber = prev.length > 0 
        ? Math.max(...prev.map(r => r.serialNumber))
        : 0
      const newSerialNumber = maxSerialNumber + 1
      
      // 创建新行
      const newRow: DormitoryRentRow = {
        key: String(newSerialNumber),
        serialNumber: newSerialNumber,
        dormShortName: '',
        address: '',
        landlordName: '',
        landlordPhone: '',
        area: '',
        leaseTerm: '',
        paymentMethod: '',
        rentAmount: 0,
        deposit: 0,
        payeeInfo: '',
        electricMeterNo: '',
        heatingCardNo: '',
        waterCard: '',
        heatingPayMethod: '',
        heatingPayAmount: 0,
        firstRentAmount: 0,
        firstRentPeriod: '',
        janRentAmount: 0,
        janRentPeriod: '',
        febRentAmount: 0,
        febRentPeriod: '',
        marRentAmount: 0,
        marRentPeriod: '',
        aprRentAmount: 0,
        aprRentPeriod: '',
        mayRentAmount: 0,
        mayRentPeriod: '',
        junRentAmount: 0,
        junRentPeriod: '',
        julRentAmount: 0,
        julRentPeriod: '',
        augRentAmount: 0,
        augRentPeriod: '',
        sepRentAmount: 0,
        sepRentPeriod: '',
        octRentAmount: 0,
        octRentPeriod: '',
        novRentAmount: 0,
        novRentPeriod: '',
        decRentAmount: 0,
        decRentPeriod: '',
        otherMonths: '',
        originalStatus: '',
        signer: '',
        dormManager: '',
        remarks: '',
      }
      
      return [...prev, newRow]
    })
    message.success('已添加一行')
  }

  const fetchFromServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      // 确保神殿名称完整（如果不以"神殿"结尾，则添加）
      const campusName = currentCampus!.endsWith('神殿') ? currentCampus! : `${currentCampus!}神殿`
      const res = await fetch(
        buildApiUrl(`/teaching-quality/campus-dormitory-rent-payment-info?campus=${encodeURIComponent(
          campusName,
        )}&year=${year}`),
      )
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const list = (data?.行列表 || []) as any[]

      // 仅根据后端返回的行构造数据，只展示真正有数据的宿舍，提高首屏渲染速度
      const mapped: DormitoryRentRow[] = list
        .map((hit: any, idx: number) => ({
          key: String(hit.serialNumber ?? idx + 1),
          serialNumber: Number(hit.serialNumber ?? idx + 1),
          dormShortName: String(hit.dormShortName || ''),
          address: String(hit.address || ''),
          landlordName: String(hit.landlordName || ''),
          landlordPhone: String(hit.landlordPhone || ''),
          area: String(hit.area || ''),
          leaseTerm: String(hit.leaseTerm || ''),
          paymentMethod: String(hit.paymentMethod || ''),
          rentAmount: Number(hit.rentAmount || 0),
          deposit: Number(hit.deposit || 0),
          payeeInfo: String(hit.payeeInfo || ''),
          electricMeterNo: String(hit.electricMeterNo || ''),
          heatingCardNo: String(hit.heatingCardNo || ''),
          waterCard: String(hit.waterCard || ''),
          heatingPayMethod: String(hit.heatingPayMethod || ''),
          heatingPayAmount: Number(hit.heatingPayAmount || 0),
          firstRentAmount: Number(hit.firstRentAmount || 0),
          firstRentPeriod: String(hit.firstRentPeriod || ''),
          janRentAmount: Number(hit.janRentAmount || 0),
          janRentPeriod: String(hit.janRentPeriod || ''),
          febRentAmount: Number(hit.febRentAmount || 0),
          febRentPeriod: String(hit.febRentPeriod || ''),
          marRentAmount: Number(hit.marRentAmount || 0),
          marRentPeriod: String(hit.marRentPeriod || ''),
          aprRentAmount: Number(hit.aprRentAmount || 0),
          aprRentPeriod: String(hit.aprRentPeriod || ''),
          mayRentAmount: Number(hit.mayRentAmount || 0),
          mayRentPeriod: String(hit.mayRentPeriod || ''),
          junRentAmount: Number(hit.junRentAmount || 0),
          junRentPeriod: String(hit.junRentPeriod || ''),
          julRentAmount: Number(hit.julRentAmount || 0),
          julRentPeriod: String(hit.julRentPeriod || ''),
          augRentAmount: Number(hit.augRentAmount || 0),
          augRentPeriod: String(hit.augRentPeriod || ''),
          sepRentAmount: Number(hit.sepRentAmount || 0),
          sepRentPeriod: String(hit.sepRentPeriod || ''),
          octRentAmount: Number(hit.octRentAmount || 0),
          octRentPeriod: String(hit.octRentPeriod || ''),
          novRentAmount: Number(hit.novRentAmount || 0),
          novRentPeriod: String(hit.novRentPeriod || ''),
          decRentAmount: Number(hit.decRentAmount || 0),
          decRentPeriod: String(hit.decRentPeriod || ''),
          otherMonths: String(hit.otherMonths || ''),
          originalStatus: String(hit.originalStatus || ''),
          signer: String(hit.signer || ''),
          dormManager: String(hit.dormManager || ''),
          remarks: String(hit.remarks || ''),
        }))
        // 按序号排序，避免后端返回乱序
        .sort((a, b) => a.serialNumber - b.serialNumber)
      setRows(mapped)
      message.success('已刷新')
    } catch (e) {
      console.error(e)
      message.error('刷新失败')
    }
  }

  const saveToServer = async () => {
    if (!canIO) {
      message.warning('请先选择神殿/年份')
      return
    }
    try {
      // 确保神殿名称完整（如果不以"神殿"结尾，则添加）
      const campusName = currentCampus!.endsWith('神殿') ? currentCampus! : `${currentCampus!}神殿`
      const payload = {
        神殿名称: campusName,
        年份: year,
        行列表: rows.map((r) => ({
          serialNumber: r.serialNumber,
          dormShortName: r.dormShortName,
          address: r.address,
          landlordName: r.landlordName,
          landlordPhone: r.landlordPhone,
          area: r.area,
          leaseTerm: r.leaseTerm,
          paymentMethod: r.paymentMethod,
          rentAmount: r.rentAmount,
          deposit: r.deposit,
          payeeInfo: r.payeeInfo,
          electricMeterNo: r.electricMeterNo,
          heatingCardNo: r.heatingCardNo,
          waterCard: r.waterCard,
          heatingPayMethod: r.heatingPayMethod,
          heatingPayAmount: r.heatingPayAmount,
          firstRentAmount: r.firstRentAmount,
          firstRentPeriod: r.firstRentPeriod,
          janRentAmount: r.janRentAmount,
          janRentPeriod: r.janRentPeriod,
          febRentAmount: r.febRentAmount,
          febRentPeriod: r.febRentPeriod,
          marRentAmount: r.marRentAmount,
          marRentPeriod: r.marRentPeriod,
          aprRentAmount: r.aprRentAmount,
          aprRentPeriod: r.aprRentPeriod,
          mayRentAmount: r.mayRentAmount,
          mayRentPeriod: r.mayRentPeriod,
          junRentAmount: r.junRentAmount,
          junRentPeriod: r.junRentPeriod,
          julRentAmount: r.julRentAmount,
          julRentPeriod: r.julRentPeriod,
          augRentAmount: r.augRentAmount,
          augRentPeriod: r.augRentPeriod,
          sepRentAmount: r.sepRentAmount,
          sepRentPeriod: r.sepRentPeriod,
          octRentAmount: r.octRentAmount,
          octRentPeriod: r.octRentPeriod,
          novRentAmount: r.novRentAmount,
          novRentPeriod: r.novRentPeriod,
          decRentAmount: r.decRentAmount,
          decRentPeriod: r.decRentPeriod,
          otherMonths: r.otherMonths,
          originalStatus: r.originalStatus,
          signer: r.signer,
          dormManager: r.dormManager,
          remarks: r.remarks,
        })),
      }
      const res = await fetch(buildApiUrl('/teaching-quality/campus-dormitory-rent-payment-info'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      message.success('保存成功')
      await fetchFromServer()
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    }
  }

  useEffect(() => {
    if (currentCampus) {
      // 首屏只加载后端已有数据，不预生成大量空行
      fetchFromServer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year])

  const columns: ColumnsType<DormitoryRentRow> = useMemo(
    () => [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center',
    },
    {
      title: '宿舍简称',
      dataIndex: 'dormShortName',
      key: 'dormShortName',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'dormShortName', e.target.value)}
        />
      ),
    },
    {
      title: '地址（房号）',
      dataIndex: 'address',
      key: 'address',
      width: 180,
      // 单元格内容保持左对齐，表头单独居中
      align: 'left',
      onHeaderCell: () => ({
        style: { textAlign: 'center' },
      }),
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'address', e.target.value)}
        />
      ),
    },
    {
      title: '房东姓名',
      dataIndex: 'landlordName',
      key: 'landlordName',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'landlordName', e.target.value)}
        />
      ),
    },
    {
      title: '联系方式',
      dataIndex: 'landlordPhone',
      key: 'landlordPhone',
      width: 130,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'landlordPhone', e.target.value)}
        />
      ),
    },
    {
      title: '平米',
      dataIndex: 'area',
      key: 'area',
      width: 80,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'area', e.target.value)}
        />
      ),
    },
    {
      title: '租期',
      dataIndex: 'leaseTerm',
      key: 'leaseTerm',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'leaseTerm', e.target.value)}
        />
      ),
    },
    {
      title: '付款方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'paymentMethod', e.target.value)}
        />
      ),
    },
    {
      title: '租金(元月/元/年)',
      dataIndex: 'rentAmount',
      key: 'rentAmount',
      width: 150,
      align: 'center',
      render: (value: number, record) => (
        <InputNumber
          min={0}
          value={value || 0}
          style={{ width: '100%' }}
          onChange={(v) => handleNumberChange(record.key, 'rentAmount', v ?? 0)}
        />
      ),
    },
    {
      title: '押金',
      dataIndex: 'deposit',
      key: 'deposit',
      width: 120,
      align: 'center',
      render: (value: number, record) => (
        <InputNumber
          min={0}
          value={value || 0}
          style={{ width: '100%' }}
          onChange={(v) => handleNumberChange(record.key, 'deposit', v ?? 0)}
        />
      ),
    },
    {
      title: '收款信息（账户、开户行、卡号）',
      dataIndex: 'payeeInfo',
      key: 'payeeInfo',
      width: 260,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'payeeInfo', e.target.value)}
        />
      ),
    },
    {
      title: '电表号',
      dataIndex: 'electricMeterNo',
      key: 'electricMeterNo',
      width: 130,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'electricMeterNo', e.target.value)}
        />
      ),
    },
    {
      title: '取暖卡号',
      dataIndex: 'heatingCardNo',
      key: 'heatingCardNo',
      width: 130,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'heatingCardNo', e.target.value)}
        />
      ),
    },
    {
      title: '水卡',
      dataIndex: 'waterCard',
      key: 'waterCard',
      width: 120,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'waterCard', e.target.value)}
        />
      ),
    },
    {
      title: '暖气费缴费方式',
      dataIndex: 'heatingPayMethod',
      key: 'heatingPayMethod',
      width: 150,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'heatingPayMethod', e.target.value)}
        />
      ),
    },
    {
      title: '暖气费缴费金额',
      dataIndex: 'heatingPayAmount',
      key: 'heatingPayAmount',
      width: 150,
      align: 'center',
      render: (value: number, record) => (
        <InputNumber
          min={0}
          value={value || 0}
          style={{ width: '100%' }}
          onChange={(v) => handleNumberChange(record.key, 'heatingPayAmount', v ?? 0)}
        />
      ),
    },
    // 首租
    {
      title: '首租',
      align: 'center',
      children: [
        {
          title: '租金',
          dataIndex: 'firstRentAmount',
          key: 'firstRentAmount',
          width: 100,
          align: 'center',
          render: (value: number, record) => (
            <InputNumber
              min={0}
              value={value || 0}
              style={{ width: '100%' }}
              onChange={(v) => handleNumberChange(record.key, 'firstRentAmount', v ?? 0)}
            />
          ),
        },
        {
          title: '租期',
          dataIndex: 'firstRentPeriod',
          key: 'firstRentPeriod',
          width: 100,
          align: 'center',
          render: (text: string, record) => (
            <Input
              placeholder="租期"
              value={text}
              onChange={(e) => handleTextChange(record.key, 'firstRentPeriod', e.target.value)}
            />
          ),
        },
      ],
    },
    // 1-12月
    {
      title: '1月',
      align: 'center',
      children: [
        {
          title: '租金',
          dataIndex: 'janRentAmount',
          key: 'janRentAmount',
          width: 100,
          align: 'center',
          render: (value: number, record) => (
            <InputNumber
              min={0}
              value={value || 0}
              style={{ width: '100%' }}
              onChange={(v) => handleNumberChange(record.key, 'janRentAmount', v ?? 0)}
            />
          ),
        },
        {
          title: '租期',
          dataIndex: 'janRentPeriod',
          key: 'janRentPeriod',
          width: 100,
          align: 'center',
          render: (text: string, record) => (
            <Input
              placeholder="租期"
              value={text}
              onChange={(e) => handleTextChange(record.key, 'janRentPeriod', e.target.value)}
            />
          ),
        },
      ],
    },
    {
      title: '2月',
      align: 'center',
      children: [
        {
          title: '租金',
          dataIndex: 'febRentAmount',
          key: 'febRentAmount',
          width: 100,
          align: 'center',
          render: (value: number, record) => (
            <InputNumber
              min={0}
              value={value || 0}
              style={{ width: '100%' }}
              onChange={(v) => handleNumberChange(record.key, 'febRentAmount', v ?? 0)}
            />
          ),
        },
        {
          title: '租期',
          dataIndex: 'febRentPeriod',
          key: 'febRentPeriod',
          width: 100,
          align: 'center',
          render: (text: string, record) => (
            <Input
              placeholder="租期"
              value={text}
              onChange={(e) => handleTextChange(record.key, 'febRentPeriod', e.target.value)}
            />
          ),
        },
      ],
    },
    {
      title: '3月',
      align: 'center',
      children: [
        {
          title: '租金',
          dataIndex: 'marRentAmount',
          key: 'marRentAmount',
          width: 100,
          align: 'center',
          render: (value: number, record) => (
            <InputNumber
              min={0}
              value={value || 0}
              style={{ width: '100%' }}
              onChange={(v) => handleNumberChange(record.key, 'marRentAmount', v ?? 0)}
            />
          ),
        },
        {
          title: '租期',
          dataIndex: 'marRentPeriod',
          key: 'marRentPeriod',
          width: 100,
          align: 'center',
          render: (text: string, record) => (
            <Input
              placeholder="租期"
              value={text}
              onChange={(e) => handleTextChange(record.key, 'marRentPeriod', e.target.value)}
            />
          ),
        },
      ],
    },
    {
      title: '4月',
      align: 'center',
      children: [
        {
          title: '租金',
          dataIndex: 'aprRentAmount',
          key: 'aprRentAmount',
          width: 100,
          align: 'center',
          render: (value: number, record) => (
            <InputNumber
              min={0}
              value={value || 0}
              style={{ width: '100%' }}
              onChange={(v) => handleNumberChange(record.key, 'aprRentAmount', v ?? 0)}
            />
          ),
        },
        {
          title: '租期',
          dataIndex: 'aprRentPeriod',
          key: 'aprRentPeriod',
          width: 100,
          align: 'center',
          render: (text: string, record) => (
            <Input
              placeholder="租期"
              value={text}
              onChange={(e) => handleTextChange(record.key, 'aprRentPeriod', e.target.value)}
            />
          ),
        },
      ],
    },
    {
      title: '5月',
      align: 'center',
      children: [
        {
          title: '租金',
          dataIndex: 'mayRentAmount',
          key: 'mayRentAmount',
          width: 100,
          align: 'center',
          render: (value: number, record) => (
            <InputNumber
              min={0}
              value={value || 0}
              style={{ width: '100%' }}
              onChange={(v) => handleNumberChange(record.key, 'mayRentAmount', v ?? 0)}
            />
          ),
        },
        {
          title: '租期',
          dataIndex: 'mayRentPeriod',
          key: 'mayRentPeriod',
          width: 100,
          align: 'center',
          render: (text: string, record) => (
            <Input
              placeholder="租期"
              value={text}
              onChange={(e) => handleTextChange(record.key, 'mayRentPeriod', e.target.value)}
            />
          ),
        },
      ],
    },
    {
      title: '6月',
      align: 'center',
      children: [
        {
          title: '租金',
          dataIndex: 'junRentAmount',
          key: 'junRentAmount',
          width: 100,
          align: 'center',
          render: (value: number, record) => (
            <InputNumber
              min={0}
              value={value || 0}
              style={{ width: '100%' }}
              onChange={(v) => handleNumberChange(record.key, 'junRentAmount', v ?? 0)}
            />
          ),
        },
        {
          title: '租期',
          dataIndex: 'junRentPeriod',
          key: 'junRentPeriod',
          width: 100,
          align: 'center',
          render: (text: string, record) => (
            <Input
              placeholder="租期"
              value={text}
              onChange={(e) => handleTextChange(record.key, 'junRentPeriod', e.target.value)}
            />
          ),
        },
      ],
    },
    {
      title: '7月',
      align: 'center',
      children: [
        {
          title: '租金',
          dataIndex: 'julRentAmount',
          key: 'julRentAmount',
          width: 100,
          align: 'center',
          render: (value: number, record) => (
            <InputNumber
              min={0}
              value={value || 0}
              style={{ width: '100%' }}
              onChange={(v) => handleNumberChange(record.key, 'julRentAmount', v ?? 0)}
            />
          ),
        },
        {
          title: '租期',
          dataIndex: 'julRentPeriod',
          key: 'julRentPeriod',
          width: 100,
          align: 'center',
          render: (text: string, record) => (
            <Input
              placeholder="租期"
              value={text}
              onChange={(e) => handleTextChange(record.key, 'julRentPeriod', e.target.value)}
            />
          ),
        },
      ],
    },
    {
      title: '8月',
      align: 'center',
      children: [
        {
          title: '租金',
          dataIndex: 'augRentAmount',
          key: 'augRentAmount',
          width: 100,
          align: 'center',
          render: (value: number, record) => (
            <InputNumber
              min={0}
              value={value || 0}
              style={{ width: '100%' }}
              onChange={(v) => handleNumberChange(record.key, 'augRentAmount', v ?? 0)}
            />
          ),
        },
        {
          title: '租期',
          dataIndex: 'augRentPeriod',
          key: 'augRentPeriod',
          width: 100,
          align: 'center',
          render: (text: string, record) => (
            <Input
              placeholder="租期"
              value={text}
              onChange={(e) => handleTextChange(record.key, 'augRentPeriod', e.target.value)}
            />
          ),
        },
      ],
    },
    {
      title: '9月',
      align: 'center',
      children: [
        {
          title: '租金',
          dataIndex: 'sepRentAmount',
          key: 'sepRentAmount',
          width: 100,
          align: 'center',
          render: (value: number, record) => (
            <InputNumber
              min={0}
              value={value || 0}
              style={{ width: '100%' }}
              onChange={(v) => handleNumberChange(record.key, 'sepRentAmount', v ?? 0)}
            />
          ),
        },
        {
          title: '租期',
          dataIndex: 'sepRentPeriod',
          key: 'sepRentPeriod',
          width: 100,
          align: 'center',
          render: (text: string, record) => (
            <Input
              placeholder="租期"
              value={text}
              onChange={(e) => handleTextChange(record.key, 'sepRentPeriod', e.target.value)}
            />
          ),
        },
      ],
    },
    {
      title: '10月',
      align: 'center',
      children: [
        {
          title: '租金',
          dataIndex: 'octRentAmount',
          key: 'octRentAmount',
          width: 100,
          align: 'center',
          render: (value: number, record) => (
            <InputNumber
              min={0}
              value={value || 0}
              style={{ width: '100%' }}
              onChange={(v) => handleNumberChange(record.key, 'octRentAmount', v ?? 0)}
            />
          ),
        },
        {
          title: '租期',
          dataIndex: 'octRentPeriod',
          key: 'octRentPeriod',
          width: 100,
          align: 'center',
          render: (text: string, record) => (
            <Input
              placeholder="租期"
              value={text}
              onChange={(e) => handleTextChange(record.key, 'octRentPeriod', e.target.value)}
            />
          ),
        },
      ],
    },
    {
      title: '11月',
      align: 'center',
      children: [
        {
          title: '租金',
          dataIndex: 'novRentAmount',
          key: 'novRentAmount',
          width: 100,
          align: 'center',
          render: (value: number, record) => (
            <InputNumber
              min={0}
              value={value || 0}
              style={{ width: '100%' }}
              onChange={(v) => handleNumberChange(record.key, 'novRentAmount', v ?? 0)}
            />
          ),
        },
        {
          title: '租期',
          dataIndex: 'novRentPeriod',
          key: 'novRentPeriod',
          width: 100,
          align: 'center',
          render: (text: string, record) => (
            <Input
              placeholder="租期"
              value={text}
              onChange={(e) => handleTextChange(record.key, 'novRentPeriod', e.target.value)}
            />
          ),
        },
      ],
    },
    {
      title: '12月',
      align: 'center',
      children: [
        {
          title: '租金',
          dataIndex: 'decRentAmount',
          key: 'decRentAmount',
          width: 100,
          align: 'center',
          render: (value: number, record) => (
            <InputNumber
              min={0}
              value={value || 0}
              style={{ width: '100%' }}
              onChange={(v) => handleNumberChange(record.key, 'decRentAmount', v ?? 0)}
            />
          ),
        },
        {
          title: '租期',
          dataIndex: 'decRentPeriod',
          key: 'decRentPeriod',
          width: 100,
          align: 'center',
          render: (text: string, record) => (
            <Input
              placeholder="租期"
              value={text}
              onChange={(e) => handleTextChange(record.key, 'decRentPeriod', e.target.value)}
            />
          ),
        },
      ],
    },
    {
      title: '宿舍原始状态',
      dataIndex: 'originalStatus',
      key: 'originalStatus',
      width: 150,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'originalStatus', e.target.value)}
        />
      ),
    },
    {
      title: '签约人',
      dataIndex: 'signer',
      key: 'signer',
      width: 110,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'signer', e.target.value)}
        />
      ),
    },
    {
      title: '宿舍管理老师',
      dataIndex: 'dormManager',
      key: 'dormManager',
      width: 130,
      align: 'center',
      render: (text: string, record) => (
        <Input
          value={text}
          onChange={(e) => handleTextChange(record.key, 'dormManager', e.target.value)}
        />
      ),
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      width: 300,
      align: 'center',
      render: (text: string, record) => (
        <Input.TextArea
          placeholder="备注：(合同中写到物业费、水电暖、垃圾费等房东出还是租户出)、已退租等。已退租的不要删除，归类放置、备注。"
          autoSize={{ minRows: 2, maxRows: 4 }}
          value={text}
          onChange={(e) => handleTextChange(record.key, 'remarks', e.target.value)}
        />
      ),
    },
  ],
    [handleTextChange, handleNumberChange],
  )

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`${currentCampus ? (currentCampus.endsWith('神殿') ? currentCampus : `${currentCampus}神殿`) : ''} · 宿舍租赁及缴费信息`}
        extra={
          <Space>
            <span>年份</span>
            <InputNumber
              min={2000}
              max={2100}
              value={year}
              onChange={(v) => setYear(typeof v === 'number' ? v : new Date().getFullYear())}
              style={{ width: 100 }}
            />
            <Button onClick={handleAddRow}>增加</Button>
            <Button onClick={fetchFromServer} disabled={!canIO}>刷新</Button>
            <Button type="primary" onClick={saveToServer} disabled={!canIO}>保存</Button>
          </Space>
        }
      >
        <Table<DormitoryRentRow>
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          pagination={false}
          rowKey="key"
          scroll={{ x: 'max-content' }}
        />
        <style>{`
          /* 宿舍租赁及缴费信息表头居中 */
          .ant-table-thead > tr > th {
            text-align: center;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default DormitoryRentPaymentInfoTable
