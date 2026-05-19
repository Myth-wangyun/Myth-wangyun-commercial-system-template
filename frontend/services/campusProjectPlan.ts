// [教质模块] 神殿项目计划服务
import { api } from './api'

export interface ProjectTask {
  date: string
  content?: string
  standard?: string
  responsiblePerson?: string
  resultDescription?: string
  supervisor?: string
}

export interface ProjectDefinitionDto {
  number: string
  name: string
  start_date?: string
  end_date?: string
  tasks: ProjectTask[]
}

export interface ProjectPlanResponse {
  campus: string
  class_id: string
  class_name: string
  class_advisor?: string | null
  reinforcement_instructor?: string | null
  projects: ProjectDefinitionDto[]
}

export const fetchProjectPlan = async (params: {
  campus: string
  class_id: string
  class_name?: string
}) => {
  const res = await api.get<ProjectPlanResponse>('/campus-project-plan', {
    params,
  })
  return res.data
}

export const saveProjectPlan = async (payload: {
  campus: string
  class_id: string
  class_name: string
  class_advisor?: string
  reinforcement_instructor?: string
  projects: ProjectDefinitionDto[]
}) => {
  const res = await api.post<ProjectPlanResponse>('/campus-project-plan', payload)
  return res.data
}
