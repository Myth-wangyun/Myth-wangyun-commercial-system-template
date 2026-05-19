// 班级档案表 - 类型定义

export interface FormerHeadTeacher {
  name: string
  startDate: string
  endDate: string
}

export interface ClassFileRecordRow {
  key: string
  serialNumber: number
  name: string
  gender: string
  idCard: string
  enrollmentDate: string
  enrollmentAge: string
  education: string
  graduationDate: string
  graduationAge: string
  highestEducationAndType: string
  campusSource: string
  enrollmentCampus: string
  consultant: string
  reportedMajor: string
  schoolingLength: string
  openingDate: string
  tuitionAmount: string
  headTeacher: string
  formerHeadTeachers: FormerHeadTeacher[]
  studentStatus: string
  previousMajor: string
  graduateSchool: string
  phone: string
  parentPhone: string
  address: string
  householdType: string
  studyMode: string
  currentAddress: string
  promisedRegisterEducation: string
  promisedEducationNature: string
  promisedEducationLevel: string
  educationSchoolName: string
  registeredSecondaryOrCollege: string
  registeredSchool: string
  remark: string
  employmentApprovalStatus: string
  className?: string // 班级名称（用于全部班级视图）
}

export interface ClassDefaults {
  openingDate: string
  schoolingLength: string
}

export interface TransferFormData {
  studentName: string
  targetCampus: string
  targetClass: string
}
