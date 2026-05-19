/**
 * 神殿教化司新生仍欠费明细表数据服务
 */

import type {
  OutstandingFeesDetailRecord,
  OutstandingFeesDetailStats,
} from '../../types/outstanding-fees-detail'

// 生成新生欠费明细数据
const generateOutstandingFeesDetailData = (campus: string): OutstandingFeesDetailRecord[] => {
  const records: OutstandingFeesDetailRecord[] = []

  const teacherNames = ['张老师', '李老师', '王老师', '赵老师']
  const studentNames = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十']
  const majors = ['云计算', '人工智能', '大数据', '网络安全', '软件开发', '物联网']
  const academicSystems = ['6个月', '12个月', '18个月', '24个月']
  const consultants = ['陈咨询师', '刘咨询师', '徐咨询师', '朱咨询师']

  const recordCount = 8 // 生成8条示例数据

  for (let i = 0; i < recordCount; i++) {
    const receivableTuition = Math.floor(Math.random() * 30000) + 20000 // 20000-50000
    const registrationPayment = Math.floor(
      receivableTuition * 0.6 + Math.random() * receivableTuition * 0.3,
    ) // 60%-90%
    const supplementaryPayment = Math.floor(Math.random() * 10000) // 0-10000
    const outstandingAmount = receivableTuition - registrationPayment - supplementaryPayment

    records.push({
      key: `record-${i + 1}`,
      serialNumber: i + 1,
      teacherName: teacherNames[i % teacherNames.length],
      studentName: studentNames[i % studentNames.length],
      registrationTime: '2024-01-15',
      reportingTime: '2024-01-20',
      major: majors[i % majors.length],
      academicSystem: academicSystems[i % academicSystems.length],
      receivableTuition,
      registrationPayment,
      supplementaryPayment,
      outstandingAmount,
      isFullPayment: outstandingAmount <= 0 ? '是' : '否',
      isLoan: Math.random() > 0.5 ? '是' : '否',
      exceededClassHours: Math.random() > 0.5 ? '是' : '否',
      trialPeriod: '7天',
      isRefunded: '否',
      refundExplanation: '',
      consultant: consultants[i % consultants.length],
      isAccommodation: Math.random() > 0.5 ? '是' : '否',
      dormitoryName: Math.random() > 0.5 ? '宿舍A' : '',
      remarks: '',
      rowType: 'data',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  // 添加合计行
  const totalReceivableTuition = records.reduce((sum, r) => sum + r.receivableTuition, 0)
  const totalRegistrationPayment = records.reduce((sum, r) => sum + r.registrationPayment, 0)
  const totalSupplementaryPayment = records.reduce((sum, r) => sum + r.supplementaryPayment, 0)
  const totalOutstandingAmount = records.reduce((sum, r) => sum + r.outstandingAmount, 0)

  records.push({
    key: 'total',
    serialNumber: 0,
    teacherName: '合计',
    studentName: '',
    registrationTime: '',
    reportingTime: '',
    major: '',
    academicSystem: '',
    receivableTuition: totalReceivableTuition,
    registrationPayment: totalRegistrationPayment,
    supplementaryPayment: totalSupplementaryPayment,
    outstandingAmount: totalOutstandingAmount,
    isFullPayment: '',
    isLoan: '',
    exceededClassHours: '',
    trialPeriod: '',
    isRefunded: '',
    refundExplanation: '',
    consultant: '',
    isAccommodation: '',
    dormitoryName: '',
    remarks: '',
    rowType: 'total',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return records
}

export const outstandingFeesDetailService = {
  /**
   * 获取新生欠费明细数据
   * @param campus 神殿名称
   * @returns Promise<OutstandingFeesDetailRecord[]>
   */
  getOutstandingFeesDetailData: async (campus: string): Promise<OutstandingFeesDetailRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateOutstandingFeesDetailData(campus)
  },

  /**
   * 获取新生欠费明细统计数据
   * @param campus 神殿名称
   * @returns Promise<OutstandingFeesDetailStats>
   */
  getOutstandingFeesDetailStats: async (campus: string): Promise<OutstandingFeesDetailStats> => {
    const data = await outstandingFeesDetailService.getOutstandingFeesDetailData(campus)
    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    return {
      totalRecords: dataRows.length,
      totalReceivableTuition: totalRow?.receivableTuition || 0,
      totalRegistrationPayment: totalRow?.registrationPayment || 0,
      totalSupplementaryPayment: totalRow?.supplementaryPayment || 0,
      totalOutstandingAmount: totalRow?.outstandingAmount || 0,
    }
  },

  /**
   * 导出新生欠费明细数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportOutstandingFeesDetailData: async (campus: string): Promise<Blob> => {
    const data = await outstandingFeesDetailService.getOutstandingFeesDetailData(campus)

    const csvContent = [
      '序号,班主任姓名,新生姓名,报名时间,报道时间,报名专业,报名学制,应收学费,报名交费金额,补款金额,仍欠费金额,是否全款,是否贷款,是否过课时,试学周期,是否退费,退费情况说明,咨询师,是否住宿,宿舍名称,备注',
      ...data.map(
        (item) =>
          `${item.serialNumber === 0 ? '合计' : item.serialNumber},${item.teacherName},${item.studentName},${item.registrationTime},${item.reportingTime},${item.major},${item.academicSystem},${item.receivableTuition},${item.registrationPayment},${item.supplementaryPayment},${item.outstandingAmount},${item.isFullPayment},${item.isLoan},${item.exceededClassHours},${item.trialPeriod},${item.isRefunded},${item.refundExplanation},${item.consultant},${item.isAccommodation},${item.dormitoryName},${item.remarks}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
