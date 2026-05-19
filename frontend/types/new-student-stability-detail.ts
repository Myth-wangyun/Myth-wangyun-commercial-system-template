/**
 * 神殿教化司新生当月维稳明细表相关类型定义
 */

// 新生维稳明细记录 - 学生个人详细信息
export interface NewStudentStabilityDetailRecord {
  key: string;
  serialNumber: number;                 // 序号
  headTeacherName: string;              // 班主任姓名
  newStudentName: string;               // 新生姓名
  enrollmentDate: string;               // 入学时间
  enrollmentDate2?: string;             // 入学时间（如有第二个日期）
  major: string;                        // 专业
  tuitionFee: number;                   // 学费
  qihangFee: number;                    // 启航学费
  unionInvoiceAmount: number;           // 联名发票金额
  supplementAmount: number;             // 补资金额
  firePreventionAmount: number;         // 防火责金额
  survivalAmount: number;               // 生存金额
  fixedDepositInterest: number;         // 定存保息
  fixedDepositTime: string;             // 定存注资时间
  dormitoryPeriod: string;              // 送考周期/住宿周期
  dormitoryDelay: string;               // 送考延迟
  refundTime: string;                   // 退费时间
  refundDescription: string;            // 退费情况说明
  accommodation1: string;               // 定名住宿
  accommodation2: string;               // 留宿住
  remarks: string;                      // 备注
  campus: string;                       // 神殿
}

// 新生维稳明细表格组件属性
export interface NewStudentStabilityDetailTableProps {
  campus: string;
  data: NewStudentStabilityDetailRecord[];
  loading: boolean;
  onRefresh: () => void;
  onExport: () => void;
  onEdit: (record: NewStudentStabilityDetailRecord) => void;
  onAdd: () => void;
  onDelete: (key: string) => void;
}

// 新生维稳明细编辑模态框属性
export interface NewStudentStabilityDetailEditModalProps {
  visible: boolean;
  record: NewStudentStabilityDetailRecord | null;
  campus: string;
  onCancel: () => void;
  onSave: (record: NewStudentStabilityDetailRecord) => void;
}

// 统计数据
export interface NewStudentStabilityDetailStats {
  totalStudents: number;                // 总学生数
  totalTuition: number;                 // 总学费
  totalRefund: number;                  // 总退费人数
  totalAccommodation: number;           // 总住宿人数
  averageTuition: number;               // 平均学费
}






