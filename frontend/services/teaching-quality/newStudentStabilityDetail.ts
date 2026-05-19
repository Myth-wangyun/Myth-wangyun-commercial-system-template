/**
 * 神殿教化司新生当月维稳明细表数据服务
 */

import type { NewStudentStabilityDetailRecord } from '../../types/new-student-stability-detail';

// 模拟数据
const mockDetailData: Record<string, NewStudentStabilityDetailRecord[]> = {
  '盛邦': [
    {
      key: '1',
      serialNumber: 1,
      headTeacherName: '转年',
      newStudentName: '',
      enrollmentDate: '2025-08-01',
      major: '软件',
      tuitionFee: 13800,
      qihangFee: 13800,
      unionInvoiceAmount: 12800,
      supplementAmount: 0,
      firePreventionAmount: 0,
      survivalAmount: 0,
      fixedDepositInterest: 0,
      fixedDepositTime: '',
      dormitoryPeriod: '1.5元',
      dormitoryDelay: '无',
      refundTime: '',
      refundDescription: '',
      accommodation1: '',
      accommodation2: '',
      remarks: '联赛 回12.2-201',
      campus: '盛邦'
    },
    {
      key: '2',
      serialNumber: 2,
      headTeacherName: '李晴',
      newStudentName: '张三',
      enrollmentDate: '2025-08-02',
      major: '前端开发',
      tuitionFee: 15000,
      qihangFee: 15000,
      unionInvoiceAmount: 14000,
      supplementAmount: 500,
      firePreventionAmount: 300,
      survivalAmount: 200,
      fixedDepositInterest: 100,
      fixedDepositTime: '2025-08-10',
      dormitoryPeriod: '2年',
      dormitoryDelay: '无',
      refundTime: '',
      refundDescription: '',
      accommodation1: 'A栋301',
      accommodation2: '已入住',
      remarks: '',
      campus: '盛邦'
    },
    {
      key: '3',
      serialNumber: 3,
      headTeacherName: '王芳',
      newStudentName: '李四',
      enrollmentDate: '2025-08-03',
      major: 'Java开发',
      tuitionFee: 16000,
      qihangFee: 16000,
      unionInvoiceAmount: 15000,
      supplementAmount: 0,
      firePreventionAmount: 300,
      survivalAmount: 0,
      fixedDepositInterest: 0,
      fixedDepositTime: '',
      dormitoryPeriod: '2年',
      dormitoryDelay: '无',
      refundTime: '',
      refundDescription: '',
      accommodation1: 'B栋202',
      accommodation2: '已入住',
      remarks: '',
      campus: '盛邦'
    },
  ],
  '冀美': [
    {
      key: '1',
      serialNumber: 1,
      headTeacherName: '赵敏',
      newStudentName: '王五',
      enrollmentDate: '2025-08-01',
      major: 'UI设计',
      tuitionFee: 14000,
      qihangFee: 14000,
      unionInvoiceAmount: 13000,
      supplementAmount: 0,
      firePreventionAmount: 300,
      survivalAmount: 0,
      fixedDepositInterest: 0,
      fixedDepositTime: '',
      dormitoryPeriod: '1.5年',
      dormitoryDelay: '无',
      refundTime: '',
      refundDescription: '',
      accommodation1: 'C栋101',
      accommodation2: '已入住',
      remarks: '',
      campus: '冀美'
    },
  ],
};

class NewStudentStabilityDetailService {
  /**
   * 获取神殿新生维稳明细数据
   */
  async getNewStudentStabilityDetailData(campus: string): Promise<NewStudentStabilityDetailRecord[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = mockDetailData[campus] || [];
        resolve(data);
      }, 500);
    });
  }

  /**
   * 新增明细记录
   */
  async addNewStudentStabilityDetailRecord(
    campus: string,
    record: NewStudentStabilityDetailRecord
  ): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!mockDetailData[campus]) {
          mockDetailData[campus] = [];
        }
        
        // 计算新的序号
        const maxSerial = mockDetailData[campus].reduce((max, r) => 
          Math.max(max, r.serialNumber), 0
        );
        
        const newRecord = {
          ...record,
          key: `${campus}-${Date.now()}`,
          serialNumber: maxSerial + 1,
        };
        
        mockDetailData[campus].push(newRecord);
        resolve();
      }, 300);
    });
  }

  /**
   * 更新明细记录
   */
  async updateNewStudentStabilityDetailRecord(
    campus: string,
    record: NewStudentStabilityDetailRecord
  ): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (mockDetailData[campus]) {
          const index = mockDetailData[campus].findIndex(r => r.key === record.key);
          if (index !== -1) {
            mockDetailData[campus][index] = record;
          }
        }
        resolve();
      }, 300);
    });
  }

  /**
   * 删除明细记录
   */
  async deleteNewStudentStabilityDetailRecord(campus: string, key: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (mockDetailData[campus]) {
          mockDetailData[campus] = mockDetailData[campus].filter(r => r.key !== key);
          // 重新计算序号
          mockDetailData[campus].forEach((r, index) => {
            r.serialNumber = index + 1;
          });
        }
        resolve();
      }, 300);
    });
  }

  /**
   * 导出明细数据为CSV
   */
  async exportNewStudentStabilityDetailData(campus: string): Promise<Blob> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = mockDetailData[campus] || [];
        
        // CSV 表头
        const headers = [
          '序号', '班主任姓名', '新生姓名', '入学时间', '专业', '学费', '启航学费',
          '联名发票金额', '补资金额', '防火责金额', '生存金额', '定存保息', '定存注资时间',
          '送考周期', '送考延迟', '退费时间', '退费情况说明', '定名住宿', '留宿住', '备注'
        ];
        
        // CSV 数据行
        const rows = data.map(record => [
          record.serialNumber,
          record.headTeacherName,
          record.newStudentName,
          record.enrollmentDate,
          record.major,
          record.tuitionFee,
          record.qihangFee,
          record.unionInvoiceAmount,
          record.supplementAmount,
          record.firePreventionAmount,
          record.survivalAmount,
          record.fixedDepositInterest,
          record.fixedDepositTime,
          record.dormitoryPeriod,
          record.dormitoryDelay,
          record.refundTime,
          record.refundDescription,
          record.accommodation1,
          record.accommodation2,
          record.remarks
        ]);
        
        // 组装 CSV 内容
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        // 添加 BOM 头以支持 Excel 正确显示中文
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        resolve(blob);
      }, 300);
    });
  }
}

export const newStudentStabilityDetailService = new NewStudentStabilityDetailService();






