import { api, HR_HEAVY_WRITE_TIMEOUT_MS } from '../api'

export interface EmployeeArchiveRecord {
  id?: number | null
  scope?: string
  orgName?: string | null
  userId: number
  username: string
  campusName?: string | null
  name: string
  department: string
  position: string
  positionCategory?: string | null
  gender?: string | null
  ethnicity?: string | null
  phone?: string | null
  nativePlace?: string | null
  entryDate?: string | null
  laborRelationCompany?: string | null
  actualWorkCompany?: string | null
  contractSignDate?: string | null
  contractEndDate?: string | null
  insuranceStartDate?: string | null
  positionNature?: string | null
  leaveDate?: string | null
  idNumber?: string | null
  birthDate?: string | null
  politicalStatus?: string | null
  maritalStatus?: string | null
  firstEducation?: string | null
  firstMajor?: string | null
  firstSchool?: string | null
  firstRemark?: string | null
  secondEducation?: string | null
  secondMajor?: string | null
  secondSchool?: string | null
  secondRemark?: string | null
  titleLevel?: string | null
  hukouAddress?: string | null
  currentAddress?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  emergencyContact?: string | null
  bankAccountName?: string | null
  bankName?: string | null
  bankCardNumber?: string | null
  baseSalary?: number | null
  performanceSalary?: number | null
  personnelChange?: string | null
  rewardWelfare?: string | null
  archiveRemark?: string | null
  userStatus: string
  canEdit: boolean
  canEditHrFields: boolean
  canEditSelfFields: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

export interface EmployeeArchiveOptions {
  departments: string[]
  positions: string[]
  positionCategories: string[]
}

export interface EmployeeArchiveChangeLogRecord {
  id: number
  employeeId: number
  fieldName: string
  fieldLabel: string
  oldValue?: string | null
  newValue?: string | null
  changeSource: string
  changeSourceLabel: string
  sourceRecordId?: number | null
  changedByUserId?: number | null
  changedByName?: string | null
  createdAt: string
}

export interface EmployeeArchivePayload {
  name?: string
  department?: string
  position?: string
  phone?: string
  gender?: string
  entryDate?: string | null
  laborRelationCompany?: string
  actualWorkCompany?: string
  positionCategory?: string
  positionNature?: string | null
  ethnicity?: string
  nativePlace?: string
  contractSignDate?: string | null
  contractEndDate?: string | null
  idNumber?: string
  birthDate?: string | null
  politicalStatus?: string
  maritalStatus?: string
  firstEducation?: string
  firstMajor?: string
  firstSchool?: string
  firstRemark?: string
  secondEducation?: string
  secondMajor?: string
  secondSchool?: string
  secondRemark?: string
  titleLevel?: string
  hukouAddress?: string
  currentAddress?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContact?: string
  bankAccountName?: string
  bankName?: string
  bankCardNumber?: string
  baseSalary?: number | null
  performanceSalary?: number | null
  personnelChange?: string
  rewardWelfare?: string
  archiveRemark?: string
}

interface ApiEmployeeArchiveRecord {
  id?: number | null
  user_id: number
  username: string
  campus_name?: string | null
  name: string
  department: string
  position: string
  position_category?: string | null
  gender?: string | null
  ethnicity?: string | null
  phone?: string | null
  native_place?: string | null
  entry_date?: string | null
  labor_relation_company?: string | null
  actual_work_company?: string | null
  contract_sign_date?: string | null
  contract_end_date?: string | null
  insurance_start_date?: string | null
  position_nature?: string | null
  leave_date?: string | null
  id_number?: string | null
  birth_date?: string | null
  political_status?: string | null
  marital_status?: string | null
  first_education?: string | null
  first_major?: string | null
  first_school?: string | null
  first_remark?: string | null
  second_education?: string | null
  second_major?: string | null
  second_school?: string | null
  second_remark?: string | null
  title_level?: string | null
  hukou_address?: string | null
  current_address?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  emergency_contact?: string | null
  bank_account_name?: string | null
  bank_name?: string | null
  bank_card_number?: string | null
  base_salary?: number | null
  performance_salary?: number | null
  personnel_change?: string | null
  reward_welfare?: string | null
  archive_remark?: string | null
  user_status: string
  can_edit: boolean
  can_edit_hr_fields: boolean
  can_edit_self_fields: boolean
  created_at?: string | null
  updated_at?: string | null
}

interface ApiEmployeeArchiveOptions {
  departments: string[]
  positions: string[]
  position_categories: string[]
}

interface ApiEmployeeArchiveChangeLogRecord {
  id: number
  employee_id: number
  field_name: string
  field_label: string
  old_value?: string | null
  new_value?: string | null
  change_source: string
  change_source_label: string
  source_record_id?: number | null
  changed_by_user_id?: number | null
  changed_by_name?: string | null
  created_at: string
}

const mapRecord = (item: ApiEmployeeArchiveRecord): EmployeeArchiveRecord => ({
  id: item.id,
  scope: (item as ApiEmployeeArchiveRecord & { scope?: string }).scope,
  orgName: (item as ApiEmployeeArchiveRecord & { org_name?: string | null }).org_name,
  userId: item.user_id,
  username: item.username,
  campusName: item.campus_name,
  name: item.name,
  department: item.department,
  position: item.position,
  positionCategory: item.position_category,
  gender: item.gender,
  ethnicity: item.ethnicity,
  phone: item.phone,
  nativePlace: item.native_place,
  entryDate: item.entry_date,
  laborRelationCompany: item.labor_relation_company,
  actualWorkCompany: item.actual_work_company,
  contractSignDate: item.contract_sign_date,
  contractEndDate: item.contract_end_date,
  insuranceStartDate: item.insurance_start_date,
  positionNature: item.position_nature,
  leaveDate: item.leave_date,
  idNumber: item.id_number,
  birthDate: item.birth_date,
  politicalStatus: item.political_status,
  maritalStatus: item.marital_status,
  firstEducation: item.first_education,
  firstMajor: item.first_major,
  firstSchool: item.first_school,
  firstRemark: item.first_remark,
  secondEducation: item.second_education,
  secondMajor: item.second_major,
  secondSchool: item.second_school,
  secondRemark: item.second_remark,
  titleLevel: item.title_level,
  hukouAddress: item.hukou_address,
  currentAddress: item.current_address,
  emergencyContactName: item.emergency_contact_name,
  emergencyContactPhone: item.emergency_contact_phone,
  emergencyContact: item.emergency_contact,
  bankAccountName: item.bank_account_name,
  bankName: item.bank_name,
  bankCardNumber: item.bank_card_number,
  baseSalary: item.base_salary,
  performanceSalary: item.performance_salary,
  personnelChange: item.personnel_change,
  rewardWelfare: item.reward_welfare,
  archiveRemark: item.archive_remark,
  userStatus: item.user_status,
  canEdit: item.can_edit,
  canEditHrFields: item.can_edit_hr_fields,
  canEditSelfFields: item.can_edit_self_fields,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

const mapChangeLogRecord = (
  item: ApiEmployeeArchiveChangeLogRecord,
): EmployeeArchiveChangeLogRecord => ({
  id: item.id,
  employeeId: item.employee_id,
  fieldName: item.field_name,
  fieldLabel: item.field_label,
  oldValue: item.old_value,
  newValue: item.new_value,
  changeSource: item.change_source,
  changeSourceLabel: item.change_source_label,
  sourceRecordId: item.source_record_id,
  changedByUserId: item.changed_by_user_id,
  changedByName: item.changed_by_name,
  createdAt: item.created_at,
})

const toApiPayload = (payload: EmployeeArchivePayload) => ({
  name: payload.name,
  department: payload.department,
  position: payload.position,
  phone: payload.phone,
  gender: payload.gender,
  entry_date: payload.entryDate || null,
  labor_relation_company: payload.laborRelationCompany,
  actual_work_company: payload.actualWorkCompany,
  position_category: payload.positionCategory,
  position_nature:
    payload.positionNature === undefined ? undefined : (payload.positionNature ?? null),
  ethnicity: payload.ethnicity,
  native_place: payload.nativePlace,
  contract_sign_date: payload.contractSignDate || null,
  contract_end_date: payload.contractEndDate || null,
  id_number: payload.idNumber,
  birth_date: payload.birthDate || null,
  political_status: payload.politicalStatus,
  marital_status: payload.maritalStatus,
  first_education: payload.firstEducation,
  first_major: payload.firstMajor,
  first_school: payload.firstSchool,
  first_remark: payload.firstRemark,
  second_education: payload.secondEducation,
  second_major: payload.secondMajor,
  second_school: payload.secondSchool,
  second_remark: payload.secondRemark,
  title_level: payload.titleLevel,
  hukou_address: payload.hukouAddress,
  current_address: payload.currentAddress,
  emergency_contact_name: payload.emergencyContactName,
  emergency_contact_phone: payload.emergencyContactPhone,
  emergency_contact: payload.emergencyContact,
  bank_account_name: payload.bankAccountName,
  bank_name: payload.bankName,
  bank_card_number: payload.bankCardNumber,
  base_salary: payload.baseSalary,
  performance_salary: payload.performanceSalary,
  personnel_change: payload.personnelChange,
  reward_welfare: payload.rewardWelfare,
  archive_remark: payload.archiveRemark,
})

export const listHqEmployeeArchives = async (params?: {
  keyword?: string
  includeInactive?: boolean
}) => {
  return listEmployeeArchives('hq', params)
}

export const listEmployeeArchives = async (
  scope: 'hq' | 'offline' | 'online',
  params?: { keyword?: string; includeInactive?: boolean },
) => {
  const response = await api.get<ApiEmployeeArchiveRecord[]>(
    '/human-resources/dashboard/employee-archive',
    {
      params: {
        scope,
        keyword: params?.keyword,
        include_inactive: params?.includeInactive ?? true,
      },
    },
  )
  return response.data.map(mapRecord)
}

export const getHqEmployeeArchiveOptions = async (): Promise<EmployeeArchiveOptions> => {
  return getEmployeeArchiveOptions('hq')
}

export const getEmployeeArchiveOptions = async (
  scope: 'hq' | 'offline' | 'online',
): Promise<EmployeeArchiveOptions> => {
  const response = await api.get<ApiEmployeeArchiveOptions>(
    '/human-resources/dashboard/employee-archive/options',
    {
      params: { scope },
    },
  )
  return {
    departments: response.data.departments,
    positions: response.data.positions,
    positionCategories: response.data.position_categories,
  }
}

export const listEmployeeArchiveChangeLogs = async (
  scope: 'hq' | 'offline' | 'online',
  userId: number,
): Promise<EmployeeArchiveChangeLogRecord[]> => {
  const response = await api.get<ApiEmployeeArchiveChangeLogRecord[]>(
    `/human-resources/dashboard/employee-archive/${userId}/change-logs`,
    {
      params: { scope },
    },
  )
  return response.data.map(mapChangeLogRecord)
}

export const updateHqEmployeeArchive = async (userId: number, payload: EmployeeArchivePayload) => {
  return updateEmployeeArchive('hq', userId, payload)
}

export const updateEmployeeArchive = async (
  scope: 'hq' | 'offline' | 'online',
  userId: number,
  payload: EmployeeArchivePayload,
) => {
  const response = await api.put<ApiEmployeeArchiveRecord>(
    `/human-resources/dashboard/employee-archive/${userId}`,
    toApiPayload(payload),
    {
      params: { scope },
      timeout: HR_HEAVY_WRITE_TIMEOUT_MS,
    },
  )
  return mapRecord(response.data)
}
