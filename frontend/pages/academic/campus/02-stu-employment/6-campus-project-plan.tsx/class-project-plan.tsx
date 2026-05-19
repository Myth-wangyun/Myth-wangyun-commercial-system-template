import React, { useMemo } from 'react'
import { Card, Table, Typography, Button, Popconfirm, Space } from 'antd'
import dayjs from 'dayjs'
import {
  defaultProjectDefinitions,
  type ProjectDefinition,
} from './project-plan-shared'

const { Title } = Typography

type PlanRow = {
  key: string
  type: 'header' | 'task'
  projectNumber: string
  projectName: string
  startDate?: string
  endDate?: string
  date?: string
  content?: string
  standard?: string
  responsiblePerson?: string
  resultDescription?: string
  supervisor?: string
  projectNumberRowSpan?: number
  projectNameRowSpan?: number
  startDateRowSpan?: number
  endDateRowSpan?: number
  projectIndex?: number
  taskIndex?: number
}

const buildPlanRows = (definitions: ProjectDefinition[]): PlanRow[] => {
  const rows: PlanRow[] = []

  definitions.forEach((project, projectIndex) => {
    const taskCount = project.tasks.length
    rows.push({
      type: 'header',
      key: `${project.number}-header`,
      projectNumber: project.number,
      projectName: project.name,
      startDate: project.startDate,
      endDate: project.endDate,
      projectNumberRowSpan: taskCount + 1,
      projectNameRowSpan: taskCount + 1,
      startDateRowSpan: taskCount + 1,
      endDateRowSpan: taskCount + 1,
      projectIndex,
    })

    project.tasks.forEach((task, taskIndex) => {
      rows.push({
        type: 'task',
        key: `${project.number}-task-${taskIndex}`,
        projectNumber: project.number,
        projectName: project.name,
        startDate: project.startDate,
        endDate: project.endDate,
        date: task.date,
        content: task.content,
        standard: task.standard,
        responsiblePerson: task.responsiblePerson,
        resultDescription: task.resultDescription,
        supervisor: task.supervisor,
        projectNumberRowSpan: 0,
        projectNameRowSpan: 0,
        startDateRowSpan: 0,
        endDateRowSpan: 0,
        projectIndex,
        taskIndex,
      })
    })
  })

  return rows
}

interface ClassProjectPlanTableProps {
  projectDefinitions?: ProjectDefinition[]
  onEditTask?: (payload: {
    projectIndex: number
    taskIndex: number
    task: ProjectDefinition['tasks'][number]
  }) => void
  onDeleteProject?: (projectIndex: number) => void
  onDeleteTask?: (projectIndex: number, taskIndex: number) => void
  onEditProjectDate?: (projectIndex: number) => void
  title?: string
}

const ClassProjectPlanTable: React.FC<ClassProjectPlanTableProps> & {
  defaultDefinitions: ProjectDefinition[]
} = ({
  projectDefinitions = defaultProjectDefinitions,
  onEditTask,
  onDeleteProject,
  onDeleteTask,
  onEditProjectDate,
  title = '智慧司项目计划表',
}) => {
  const dataSource = useMemo(() => buildPlanRows(projectDefinitions), [projectDefinitions])

  const columns = useMemo(
    () => [
      {
        title: '项目序号',
        dataIndex: 'projectNumber',
        key: 'projectNumber',
        width: 120,
        align: 'center' as const,
        onCell: (record: PlanRow) => ({
          rowSpan: record.projectNumberRowSpan,
        }),
        render: (value: string, record: PlanRow) =>
          record.type === 'header' ? <strong>{value}</strong> : value,
      },
      {
        title: '项目名称',
        dataIndex: 'projectName',
        key: 'projectName',
        width: 200,
        align: 'center' as const,
        onCell: (record: PlanRow) => ({
          rowSpan: record.projectNameRowSpan,
        }),
        render: (value: string, record: PlanRow) =>
          record.type === 'header' ? <strong>{value}</strong> : value,
      },
      {
        title: '开始日期',
        dataIndex: 'startDate',
        key: 'startDate',
        width: 140,
        align: 'center' as const,
        onCell: (record: PlanRow) => ({
          rowSpan: record.startDateRowSpan,
        }),
        render: (value: string, record: PlanRow) =>
          record.type === 'header' && value ? (
            <span
              style={{ cursor: onEditProjectDate ? 'pointer' : 'default', color: onEditProjectDate ? '#1890ff' : undefined }}
              onClick={() => onEditProjectDate && record.projectIndex !== undefined && onEditProjectDate(record.projectIndex)}
              title="点击修改日期范围"
            >
              {dayjs(value).format('MM月DD日')}
            </span>
          ) : undefined,
      },
      {
        title: '结束日期',
        dataIndex: 'endDate',
        key: 'endDate',
        width: 140,
        align: 'center' as const,
        onCell: (record: PlanRow) => ({
          rowSpan: record.endDateRowSpan,
        }),
        render: (value: string, record: PlanRow) =>
          record.type === 'header' && value ? (
            <span
              style={{ cursor: onEditProjectDate ? 'pointer' : 'default', color: onEditProjectDate ? '#1890ff' : undefined }}
              onClick={() => onEditProjectDate && record.projectIndex !== undefined && onEditProjectDate(record.projectIndex)}
              title="点击修改日期范围"
            >
              {dayjs(value).format('MM月DD日')}
            </span>
          ) : undefined,
      },
      {
        title: '日期',
        dataIndex: 'date',
        key: 'date',
        width: 120,
        align: 'center' as const,
        render: (value: string) => (value ? dayjs(value).format('MM月DD日') : value),
      },
      {
        title: '具体制作内容',
        dataIndex: 'content',
        key: 'content',
        width: 240,
      },
      {
        title: '具体制作标准',
        dataIndex: 'standard',
        key: 'standard',
        width: 240,
      },
      {
        title: '负责人',
        dataIndex: 'responsiblePerson',
        key: 'responsiblePerson',
        width: 140,
      },
      {
        title: '结果描述',
        dataIndex: 'resultDescription',
        key: 'resultDescription',
        width: 180,
      },
      {
        title: '监督人',
        dataIndex: 'supervisor',
        key: 'supervisor',
        width: 140,
      },
      {
        title: '操作',
        key: 'actions',
        width: 180,
        align: 'center' as const,
        render: (_: unknown, record: PlanRow) => {
          if (record.type === 'header') {
            // 项目头行：显示删除项目按钮
            return onDeleteProject ? (
              <Popconfirm
                title="确定要删除这个项目吗？"
                description="删除后无法恢复"
                onConfirm={() => record.projectIndex !== undefined && onDeleteProject(record.projectIndex)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" size="small" danger>
                  删除项目
                </Button>
              </Popconfirm>
            ) : null;
          }
          // 任务行：显示编辑和删除日期行按钮
          return (
            <Space size="small">
              {onEditTask && (
                <Button
                  type="link"
                  size="small"
                  onClick={() =>
                    onEditTask({
                      projectIndex: record.projectIndex!,
                      taskIndex: record.taskIndex!,
                      task: projectDefinitions[record.projectIndex!].tasks[record.taskIndex!],
                    })
                  }
                >
                  编辑
                </Button>
              )}
              {onDeleteTask && (
                <Popconfirm
                  title="确定要删除这个日期行吗？"
                  onConfirm={() =>
                    record.projectIndex !== undefined &&
                    record.taskIndex !== undefined &&
                    onDeleteTask(record.projectIndex, record.taskIndex)
                  }
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="link" size="small" danger>
                    删除
                  </Button>
                </Popconfirm>
              )}
            </Space>
          );
        },
      },
    ],
    [projectDefinitions, onEditTask, onDeleteProject, onDeleteTask, onEditProjectDate],
  )

  return (
    <Card bordered={false}>
      {title ? (
        <Title level={4} style={{ marginBottom: 16 }}>
          {title}
        </Title>
      ) : null}
      <Table<PlanRow>
        bordered
        size="small"
        dataSource={dataSource}
        columns={columns}
        pagination={false}
        rowKey="key"
        sticky
        scroll={{ x: 'max-content', y: 600 }}
      />
    </Card>
  )
}

ClassProjectPlanTable.defaultDefinitions = defaultProjectDefinitions

export default ClassProjectPlanTable
