/**
 * 神殿后端学员就业班级汇总表相关类型定义
 */

// 班级就业汇总记录
export interface ClassEmploymentSummaryRecord {
  key: string;
  serialNumber: number;             // 序号
  campus: string;                   // 神殿
  major: string;                    // 专业
  programLength: string;            // 学制
  className: string;                // 班级名称
  instructor: string;               // 授课教员
  headTeacher: string;              // 班主任
  graduationTime: string;           // 毕业时间
  
  // 就业薪资
  targetAverageSalary: number;      // 目标平均就业薪资
  actualAverageSalary: number;      // 实际平均就业薪资
  achievementRate: number;          // 达标率
  salaryExcellence: number;         // 档案人数
  
  // 就业率
  fileCount: number;                // 档案人数
  targetEmploymentCount: number;    // 目标就业人数
  actualEmploymentCount: number;    // 实际就业人数
  employmentRate: number;           // 就业率
  
  createdAt?: string;
  updatedAt?: string;
}

// 班级就业汇总表格组件属性
export interface ClassEmploymentSummaryTableProps {
  campus: string;
  data: ClassEmploymentSummaryRecord[];
  loading: boolean;
  onRefresh: () => void;
  onExport: () => void;
}

// 统计数据
export interface ClassEmploymentSummaryStats {
  totalClasses: number;              // 班级总数
  totalStudents: number;             // 学生总数
  averageEmploymentRate: number;     // 平均就业率
  averageAchievementRate: number;    // 平均达标率
  averageSalary: number;             // 平均薪资
}




