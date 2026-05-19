/**
 * 神殿教化司个人负责学籍统计表相关类型定义
 */

// 神殿教化司个人负责学籍统计记录（按人员汇总）
export interface CampusPersonalEnrollmentStatisticsRecord {
  key: string;
  sequence: number;                      // 序号
  name: string;                          // 姓名
  
  // 中专层次
  vocational3YearRegistered: number;      // 中专3年学籍注册人数
  vocational1YearRegistered: number;      // 中专1年制人数
  vocationalOtherRegistered: number;      // 其他已注册人数
  vocationalTargetCount: number;          // 目标注册人数
  vocationalTargetTime: string;           // 目标注册时间
  vocationalActualRegistered: number;     // 实际注册人数
  
  // 大学层次
  adultExamRegistered: number;            // 成考注册人数
  openUniversityRegistered: number;       // 国开注册人数
  universityOtherRegistered: number;      // 其他已注册人数
  universityTargetCount: number;          // 目标注册人数
  universityTargetTime: string;           // 目标注册时间
  universityActualRegistered: number;     // 实际注册人数
  
  isTotal?: boolean;                      // 是否为合计行
}

// 表格组件 Props
export interface CampusPersonalEnrollmentStatisticsTableProps {
  dataSource: CampusPersonalEnrollmentStatisticsRecord[];
  loading?: boolean;
  onEdit?: (record: CampusPersonalEnrollmentStatisticsRecord) => void;
  onDelete?: (key: string) => void;
}

// 编辑对话框 Props
export interface CampusPersonalEnrollmentStatisticsEditModalProps {
  visible: boolean;
  record: CampusPersonalEnrollmentStatisticsRecord | null;
  onCancel: () => void;
  onOk: (values: Partial<CampusPersonalEnrollmentStatisticsRecord>) => void;
}






