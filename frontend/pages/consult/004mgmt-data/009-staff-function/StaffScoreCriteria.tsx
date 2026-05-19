import React from 'react'
import { Card, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface CriteriaRow {
  key: string
  no: number
  category: string
  item: string
  excellent: string
  good: string
  qualified: string
  poor: string
  isMerged?: boolean // If true, excellent spans 4 cols
}

const DATA: CriteriaRow[] = [
  { 
    key: '1', no: 1, category: '核心业务能力', item: '招生收入', 
    excellent: '年度招生收入180万为优', good: '年度招生收入160万以上为良', qualified: '年度收入120万以上为合格', poor: '年度收入120万以下为差' 
  },
  { 
    key: '2', no: 2, category: '核心业务能力', item: '面转率', 
    excellent: '面转率50%为优', good: '面转率40%为良', qualified: '面转率35%为合格', poor: '面转率低于35%为差' 
  },
  { 
    key: '3', no: 3, category: '核心业务能力', item: '上门率', 
    excellent: '上门率15%为优', good: '上门率12%为良', qualified: '10%以上为合格', poor: '10%以下为差' 
  },
  { 
    key: '4', no: 4, category: '核心业务能力', item: '总转率', 
    excellent: '总转率5%以上为优', good: '总转率4%以上为良', qualified: '3%以上为合格', poor: '3%以下为差' 
  },
  { 
    key: '5', no: 5, category: '一般业务能力', item: '宣讲', 
    excellent: '上级领导进行打分', good: '', qualified: '', poor: '', isMerged: true 
  },
  { 
    key: '6', no: 6, category: '一般业务能力', item: '电话量', 
    excellent: '月度平均电话量达标率100%为优', good: '电话量达标率95%以上为良', qualified: '达标率90%以上为合格', poor: '达标率90%以下为差' 
  },
  { 
    key: '7', no: 7, category: '一般业务能力', item: '退费率', 
    excellent: '退费率10%以下为优', good: '20%以下为良', qualified: '30%以下为合格', poor: '高于30%为差' 
  },
  { 
    key: '8', no: 8, category: '一般业务能力', item: '数据分析', 
    excellent: '当月重点人群转化占比', good: '', qualified: '', poor: '', isMerged: true 
  },
  { 
    key: '9', no: 9, category: '价值观', item: '责任心', 
    excellent: '上级领导进行打分', good: '', qualified: '', poor: '', isMerged: true 
  },
  { 
    key: '10', no: 10, category: '价值观', item: '执行力', 
    excellent: '上级领导进行打分', good: '', qualified: '', poor: '', isMerged: true 
  },
  { 
    key: '11', no: 11, category: '价值观', item: '吃苦耐劳', 
    excellent: '上级领导进行打分', good: '', qualified: '', poor: '', isMerged: true 
  },
  { 
    key: '12', no: 12, category: '价值观', item: '团队精神', 
    excellent: '上级领导进行打分', good: '', qualified: '', poor: '', isMerged: true 
  },
  { 
    key: '13', no: 13, category: '价值观', item: '职业化', 
    excellent: '上级领导进行打分', good: '', qualified: '', poor: '', isMerged: true 
  },
  { 
    key: '14', no: 14, category: '价值观', item: '向内归因', 
    excellent: '上级领导进行打分', good: '', qualified: '', poor: '', isMerged: true 
  },
  { 
    key: '15', no: 15, category: '价值观', item: '情绪管理', 
    excellent: '上级领导进行打分', good: '', qualified: '', poor: '', isMerged: true 
  },
  { 
    key: '16', no: 16, category: '价值观', item: '结果导向', 
    excellent: '上级领导进行打分', good: '', qualified: '', poor: '', isMerged: true 
  },
  { 
    key: '17', no: 17, category: '价值观', item: '沟通能力', 
    excellent: '上级领导进行打分', good: '', qualified: '', poor: '', isMerged: true 
  },
  { 
    key: '18', no: 18, category: '附加', item: '可异地调度', 
    excellent: '上级领导进行打分', good: '', qualified: '', poor: '', isMerged: true 
  },
]

export default function StaffScoreCriteria() {
  const columns: ColumnsType<CriteriaRow> = [
    {
      title: '序号',
      dataIndex: 'no',
      width: 60,
      align: 'center',
    },
    {
      title: '类别',
      dataIndex: 'category',
      width: 100,
      align: 'center',
      onCell: (record, index) => {
        if (record.no === 1) return { rowSpan: 4 }
        if (record.no >= 2 && record.no <= 4) return { rowSpan: 0 }
        
        if (record.no === 5) return { rowSpan: 4 }
        if (record.no >= 6 && record.no <= 8) return { rowSpan: 0 }
        
        if (record.no === 9) return { rowSpan: 9 }
        if (record.no >= 10 && record.no <= 17) return { rowSpan: 0 }
        
        return {}
      }
    },
    {
      title: '评分标准', // This header title is from image, though it means 'Item'
      dataIndex: 'item',
      width: 120,
      align: 'center',
    },
    {
      title: '优',
      children: [
        {
          title: '10分制9-10/5分制5',
          dataIndex: 'excellent',
          width: 200,
          align: 'center',
          onCell: (record) => {
            if (record.isMerged) {
              return { colSpan: 4 }
            }
            return {}
          }
        }
      ]
    },
    {
      title: '良',
      children: [
        {
          title: '10分制7-8/5分制4',
          dataIndex: 'good',
          width: 200,
          align: 'center',
          onCell: (record) => {
            if (record.isMerged) {
              return { colSpan: 0 }
            }
            return {}
          }
        }
      ]
    },
    {
      title: '合格',
      children: [
        {
          title: '10分制6/5分制3',
          dataIndex: 'qualified',
          width: 200,
          align: 'center',
          onCell: (record) => {
            if (record.isMerged) {
              return { colSpan: 0 }
            }
            return {}
          }
        }
      ]
    },
    {
      title: '差',
      children: [
        {
          title: '10分制0-4/5分制0-2',
          dataIndex: 'poor',
          width: 200,
          align: 'center',
          onCell: (record) => {
            if (record.isMerged) {
              return { colSpan: 0 }
            }
            return {}
          }
        }
      ]
    },
  ]

  return (
    <div style={{ padding: 16, backgroundColor: '#fff' }}>
      <div style={{ 
         background: '#ffc000', 
         padding: '12px', 
         textAlign: 'center', 
         fontWeight: 'bold', 
         fontSize: '18px',
         borderBottom: '1px solid #f0f0f0'
       }}>
         评分标准
       </div>
      <Table
        columns={columns}
        dataSource={DATA}
        pagination={false}
        bordered
        size="middle"
        rowKey="key"
      />
      
      <div style={{ marginTop: 20, padding: 16 }}>
        <h4 style={{ fontWeight: 'bold' }}>绩效结构：</h4>
        <p><strong>一、核心业务（1-4项）：</strong>聚焦最终业务成果，是评估的关键。权重应最高。</p>
        <p><strong>二、一般业务（5-8项）：</strong>关注过程管理和工作质量，支撑核心结果的达成。</p>
        <p><strong>三、价值观（9-17项）：</strong>考察行为与软素质，是团队协作和文化契合度的体现。</p>
        <p><strong>四、附加项（第18项）：</strong>作为特殊贡献或潜力的加分项，尤其在需要灵活调配人力资源时很重要。</p>

        <h4 style={{ fontWeight: 'bold', marginTop: 16 }}>评分逻辑：</h4>
        <p><strong>量化指标：</strong>核心业务和部分一般业务有明确的数字标准，客观性强，减少了主观争议。</p>
        <p><strong>主观评价：</strong>价值观和能力项依赖上级评价，建议配合具体行为描述或关键事件来保证公正性。</p>
        <p><strong>“数据分析”项：</strong>标准描述（“当月重点人群转化占比”）更像是一个观测点，而非明确的评分阶梯。建议将其转化为量化标准（如占比达到X%为优）或明确为定性分析能力的评估。</p>

        <h4 style={{ fontWeight: 'bold', marginTop: 16 }}>应用建议：</h4>
        <p><strong>明确权重：</strong>在正式评估前，应为每个类别甚至每个项目分配明确的权重，以计算总分。例如，核心业务能力可能占50%，一般业务占20%，价值观占30%。</p>
        <p><strong>领导打分标准统一：</strong>对于由领导打分的项目，应制定统一的行为锚定等级描述，避免因个人标准不同造成的不公平。</p>
        <p><strong>数据来源透明：</strong>所有量化指标的数据来源和计算口径必须公开透明，经得起验证。</p>
      </div>

      <style>{`
         .ant-table-thead > tr > th {
           background-color: #e2efda !important;
           text-align: center !important;
           border-color: #000 !important;
           color: #000 !important;
           font-weight: bold !important;
         }
         .ant-table-tbody > tr > td {
           border-color: #000 !important;
           padding: 6px 8px !important;
         }
         .ant-table-bordered .ant-table-container {
           border-color: #000 !important;
         }
       `}</style>
    </div>
  )
}
