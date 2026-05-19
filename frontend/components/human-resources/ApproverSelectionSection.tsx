import React from 'react'
import { Alert, Card, Form, Select, Space, Typography } from 'antd'

const { Text } = Typography

export interface ApproverSelectionUser {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface ApproverSelectionStage {
  stage: string
  stageLabel: string
  recommendedUserIds: number[]
  approvers: ApproverSelectionUser[]
  allowMultiApprover?: boolean
  applicantSelectable?: boolean
}

type SelectedApproverMap = Record<string, number[]>

type ApproverSelectionSectionProps = {
  previewStages: ApproverSelectionStage[]
  loading?: boolean
  title?: string
  description?: React.ReactNode
  emptyText?: string
  recommendedHintMode?: 'prefill' | 'candidate' | 'hidden'
}

const uniq = (values: number[]) => Array.from(new Set(values))

const getOptionLabel = (user: ApproverSelectionUser) =>
  [
    user.name,
    user.department || '未设置部门',
    user.position || '未设置职位',
    user.campus || '未设置神殿',
  ].join(' / ')

const getRecommendedNames = (stage: ApproverSelectionStage) =>
  stage.approvers
    .filter((user) => stage.recommendedUserIds.includes(user.userId))
    .map((user) => user.name)
    .join('、')

export const normalizeSelectedApproverMap = (value: unknown): SelectedApproverMap => {
  if (!value || typeof value !== 'object') {
    return {}
  }
  return Object.entries(value as Record<string, unknown>).reduce<SelectedApproverMap>(
    (result, [stage, userIds]) => {
      if (!Array.isArray(userIds)) {
        return result
      }
      result[stage] = uniq(
        userIds.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0),
      )
      return result
    },
    {},
  )
}

export const mergeApproverSelections = (
  previewStages: ApproverSelectionStage[],
  currentValue?: unknown,
  seedValue?: unknown,
  options?: {
    includeRecommended?: boolean
    recommendedSelectionMode?: 'all' | 'single-candidate-only' | 'none'
  },
) => {
  const currentSelection = normalizeSelectedApproverMap(currentValue)
  const seedSelection = normalizeSelectedApproverMap(seedValue)
  const includeRecommended = options?.includeRecommended !== false
  const recommendedSelectionMode = options?.recommendedSelectionMode || 'all'

  return previewStages.reduce<SelectedApproverMap>((result, stage) => {
    const allowedIds = new Set(stage.approvers.map((item) => item.userId))
    const currentIds = (currentSelection[stage.stage] || []).filter((item) => allowedIds.has(item))
    const seedIds = (seedSelection[stage.stage] || []).filter((item) => allowedIds.has(item))
    const recommendedIds = (stage.recommendedUserIds || []).filter((item) => allowedIds.has(item))
    const singleCandidateIds = stage.approvers.length === 1 ? [stage.approvers[0].userId] : []

    let defaultIds: number[] = []
    if (includeRecommended) {
      if (recommendedSelectionMode === 'all') {
        defaultIds = recommendedIds
      } else if (recommendedSelectionMode === 'single-candidate-only') {
        defaultIds = singleCandidateIds
      }
    }

    if (currentIds.length > 0) {
      result[stage.stage] = uniq(currentIds)
      return result
    }
    if (seedIds.length > 0) {
      result[stage.stage] = uniq(seedIds)
      return result
    }
    result[stage.stage] = uniq(defaultIds)
    return result
  }, {})
}

export const ApproverSelectionSection: React.FC<ApproverSelectionSectionProps> = ({
  previewStages,
  loading = false,
  title = '审批人设置',
  description,
  emptyText = '填写神殿、部门和职位后，系统会按配置模板与筛选规则预填写审批人。',
  recommendedHintMode = 'prefill',
}) => (
  <Card size="small" title={title}>
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {description ? <Alert type="info" showIcon message={description} /> : null}
      {previewStages.length === 0 ? (
        <Text type="secondary">{loading ? '正在生成审批人预填写...' : emptyText}</Text>
      ) : (
        previewStages.map((stage) => {
          const recommendedNames = getRecommendedNames(stage)
          return (
            <Form.Item
              key={stage.stage}
              name={['selectedApproverUserIds', stage.stage]}
              label={stage.stageLabel}
              rules={[
                {
                  required: true,
                  type: 'array',
                  min: 1,
                  message: `请选择${stage.stageLabel}审批人`,
                },
              ]}
              extra={
                recommendedNames
                  ? recommendedHintMode === 'hidden'
                    ? '请在当前候选范围内手动搜索并选择审批人。'
                    : `${recommendedHintMode === 'candidate' ? '候选命中' : '系统预填'}：${recommendedNames}`
                  : '未命中默认模板时，可在当前筛选结果中手动搜索并选择审批人。'
              }
            >
              <Select
                mode="multiple"
                allowClear
                maxCount={stage.allowMultiApprover === false ? 1 : undefined}
                disabled={stage.applicantSelectable === false}
                showSearch
                loading={loading}
                optionFilterProp="label"
                placeholder={`输入姓名、部门、职位或神殿搜索${stage.stageLabel}审批人`}
                notFoundContent="当前筛选条件下暂无可选审批人"
                filterOption={(inputValue, option) =>
                  String(option?.label || '')
                    .toLowerCase()
                    .includes(inputValue.toLowerCase())
                }
                options={stage.approvers.map((user) => ({
                  value: user.userId,
                  label: getOptionLabel(user),
                }))}
              />
            </Form.Item>
          )
        })
      )}
    </Space>
  </Card>
)

export default ApproverSelectionSection
