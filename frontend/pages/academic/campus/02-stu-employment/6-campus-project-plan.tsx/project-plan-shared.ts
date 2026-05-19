export type ProjectTaskDefinition = {
  date: string
  content?: string
  standard?: string
  responsiblePerson?: string
  resultDescription?: string
  supervisor?: string
}

export type ProjectDefinition = {
  number: string
  name: string
  startDate?: string
  endDate?: string
  tasks: ProjectTaskDefinition[]
}

export const defaultProjectDefinitions: ProjectDefinition[] = []
