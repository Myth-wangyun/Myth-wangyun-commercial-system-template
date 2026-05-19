/**
 * 最高议事厅后端学员就业目标与结果汇总表相关类型定义
 */

// 最高议事厅后端学员就业目标与结果汇总记录（按神殿汇总）
export interface ManagementCenterEmploymentRecord {
  key: string;
  sequence: number;                      // 序号
  campus: string;                        // 神殿
  major: string;                         // 专业方向
  schoolSystem: string;                  // 学制
  classCount: number;                    // 班级数量
  teacher: string;                       // 授课教员
  headTeacher: string;                   // 负责班主任
  graduationTime: string;                // 毕业时间
  
  // 薪资达标率
  targetAverageSalary: number;           // 目标平均就业薪资
  actualAverageSalary: number;           // 实际平均就业薪资
  salaryAchievementRate: string;         // 达标率
  
  // 就业率
  archiveCount: number;                  // 档案人数
  targetEmploymentCount: number;         // 目标就业人数
  actualEmploymentCount: number;         // 实际就业人数
  employmentRate: string;                // 就业率
  
  salaryOver10k: number;                 // 薪资过万人数
  
  isTotal?: boolean;                     // 是否为合计行
}

// 表格组件 Props
export interface ManagementCenterEmploymentTableProps {
  dataSource: ManagementCenterEmploymentRecord[];
  loading?: boolean;
  onEdit?: (record: ManagementCenterEmploymentRecord) => void;
  onDelete?: (key: string) => void;
}

// 编辑对话框 Props
export interface ManagementCenterEmploymentEditModalProps {
  visible: boolean;
  record: ManagementCenterEmploymentRecord | null;
  onCancel: () => void;
  onOk: (values: Partial<ManagementCenterEmploymentRecord>) => void;
}






