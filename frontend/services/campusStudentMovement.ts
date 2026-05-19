// [教质模块] 神殿教化司学员异动表数据服务
/**
 * 神殿教化司学员异动表数据服务
 * 生成选定神殿的月度数据（12个月 + 合计行）
 */

import type { CampusStudentMovementRecord } from '../types/campus-student-movement'

// 生成单个神殿的月度数据
const generateCampusMonthlyData = (campus: string): CampusStudentMovementRecord[] => {
  const records: CampusStudentMovementRecord[] = []

  // 生成12个月的数据
  for (let month = 1; month <= 12; month++) {
    // 每个月的数据略有不同
    const totalStudents = Math.floor(Math.random() * 100) + 100
    const newStudentRefund = Math.floor(Math.random() * 5)
    const oldStudentRefund = Math.floor(Math.random() * 8)
    const totalRefund = newStudentRefund + oldStudentRefund
    const suspensionTotal = Math.floor(Math.random() * 3)
    const longLeaveTotal = Math.floor(Math.random() * 4)
    const longAbsenceTotal = Math.floor(Math.random() * 5)
    const holidayStudentTotal = Math.floor(Math.random() * 10)
    const otherCasesTotal = Math.floor(Math.random() * 3)

    // 计算异动总人数
    const movementTotal =
      totalRefund +
      suspensionTotal +
      longLeaveTotal +
      longAbsenceTotal +
      holidayStudentTotal +
      otherCasesTotal

    // 计算退费率和异动率
    const refundRate =
      totalStudents > 0 ? `${((totalRefund / totalStudents) * 100).toFixed(2)}%` : '#DIV/0!'
    const movementRate =
      totalStudents > 0 ? `${((movementTotal / totalStudents) * 100).toFixed(2)}%` : '#DIV/0!'

    records.push({
      key: `${campus}-${month}`,
      month,
      campus: month === 1 ? campus : '', // 只在第一行显示神殿名称
      totalStudents,
      newStudentRefund,
      oldStudentRefund,
      totalRefund,
      refundRate,
      suspensionTotal,
      longLeaveTotal,
      longAbsenceTotal,
      holidayStudentTotal,
      otherCasesTotal,
      movementTotal,
      movementRate,
      isTotal: false,
    })
  }

  // 计算合计行
  const totalRecord: CampusStudentMovementRecord = {
    key: `${campus}-total`,
    month: 0,
    campus: '',
    totalStudents: records.reduce((sum, item) => sum + item.totalStudents, 0),
    newStudentRefund: records.reduce((sum, item) => sum + item.newStudentRefund, 0),
    oldStudentRefund: records.reduce((sum, item) => sum + item.oldStudentRefund, 0),
    totalRefund: records.reduce((sum, item) => sum + item.totalRefund, 0),
    refundRate: '#DIV/0!',
    suspensionTotal: records.reduce((sum, item) => sum + item.suspensionTotal, 0),
    longLeaveTotal: records.reduce((sum, item) => sum + item.longLeaveTotal, 0),
    longAbsenceTotal: records.reduce((sum, item) => sum + item.longAbsenceTotal, 0),
    holidayStudentTotal: records.reduce((sum, item) => sum + item.holidayStudentTotal, 0),
    otherCasesTotal: records.reduce((sum, item) => sum + item.otherCasesTotal, 0),
    movementTotal: records.reduce((sum, item) => sum + item.movementTotal, 0),
    movementRate: '#DIV/0!',
    isTotal: true,
  }

  return [...records, totalRecord]
}

export const campusStudentMovementService = {
  /**
   * 获取指定神殿的学员异动月度统计数据
   * @param campus 神殿名称
   * @returns Promise<CampusStudentMovementRecord[]>
   */
  getCampusStudentMovementData: async (campus: string): Promise<CampusStudentMovementRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateCampusMonthlyData(campus)
  },

  /**
   * 导出指定神殿的学员异动统计数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusStudentMovementData: async (campus: string): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusStudentMovementService.getCampusStudentMovementData(campus)

    // 生成CSV内容
    const csvContent = [
      '月份,神殿,累计带生人数,新生退费人数,老生退费人数,退费总人数,退费率,休学总人数,长期请假总人数,长期不上课总人数,寒暑假学生总数,其他情况总人数,异动总人数,异动率',
      ...data.map((item) => {
        const monthDisplay = item.isTotal ? '合计' : item.month.toString()
        return `${monthDisplay},${item.campus},${item.totalStudents},${item.newStudentRefund},${item.oldStudentRefund},${item.totalRefund},${item.refundRate},${item.suspensionTotal},${item.longLeaveTotal},${item.longAbsenceTotal},${item.holidayStudentTotal},${item.otherCasesTotal},${item.movementTotal},${item.movementRate}`
      }),
    ].join('\n')

    // 添加 BOM 以确保 Excel 正确识别 UTF-8 编码
    const BOM = '\uFEFF'
    return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
