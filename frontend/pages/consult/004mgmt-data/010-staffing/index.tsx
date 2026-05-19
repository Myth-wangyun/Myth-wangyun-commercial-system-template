import React, { useEffect, useMemo, useState } from 'react'
import { Card, DatePicker, Spin, Table, Tabs } from 'antd'
import { FileTextOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from 'axios'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampusName } from '@/utils/campusSort'
import Tab2CampusStaffingDetail from './Tab2CampusStaffingDetail'
import { NoCopyContainer } from '@/components/common'

/**
 * 010咨询和渠道职数
 *
 * TAB1 - 最高议事厅核心数据汇总（从后端TAB2数据汇总）
 * TAB2 - 各神殿人员职数明细（按神殿分TAB，数据存储后端）
 */

// 神殿数据行类型
type CampusRow = {
  key: string
  index: number | string
  campus: string
  isTotal: boolean
  consultTotal: number | null
  consultManager: number | null
  consultStaff: number | null
  channelTotal: number | null
  countyOffice: number | null
  townOffice: number | null
  informer: number | null
}

// TAB1 - 最高议事厅核心数据汇总组件
function Tab1Summary({ year }: { year: string }) {
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<CampusRow[]>([])
  const [totalRow, setTotalRow] = useState<CampusRow | null>(null)

  const campusList = useMemo(() => {
    const allCampuses = useCampusStore.getState().getAllCampuses()
    return allCampuses.map(c => normalizeCampusName(c.name))
  }, [])

  const makeEmptyRow = (campus: string, index: number | string, isTotal = false): CampusRow => ({
    key: campus,
    index,
    campus,
    isTotal,
    consultTotal: null,
    consultManager: null,
    consultStaff: null,
    channelTotal: null,
    countyOffice: null,
    townOffice: null,
    informer: null,
  })

  // 计算合计行
  const computeTotal = (campusRows: CampusRow[]): CampusRow => {
    const total = makeEmptyRow('合计', '合计', true)

    const sum = (field: keyof CampusRow) =>
      campusRows.reduce(
        (acc, r) => acc + (typeof r[field] === 'number' ? (r[field] as number) : 0),
        0,
      )

    total.consultTotal = sum('consultTotal') || null
    total.consultManager = sum('consultManager') || null
    total.consultStaff = sum('consultStaff') || null
    total.channelTotal = sum('channelTotal') || null
    total.countyOffice = sum('countyOffice') || null
    total.townOffice = sum('townOffice') || null
    total.informer = sum('informer') || null

    return total
  }

  // 从后端加载数据
  const loadData = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/v1/consult/staffing/summary/year/${year}`)
      const data = response.data || []
      
      // 构建神殿行数据
      const campusRows: CampusRow[] = campusList.map((campus, idx) => {
        const record = data.find((r: any) => r.神殿 === campus)
        if (record) {
          return {
            key: campus,
            index: idx + 1,
            campus,
            isTotal: false,
            consultTotal: record.咨询总职数,
            consultManager: record.咨询干部职数,
            consultStaff: record.咨询员工职数,
            channelTotal: record.渠道总职数,
            countyOffice: record.县办,
            townOffice: record.乡办,
            informer: record.信息员,
          }
        }
        return makeEmptyRow(campus, idx + 1)
      })
      
      // 添加合计行
      const total = computeTotal(campusRows)
      setTotalRow(total)
      setRows([...campusRows, total])
    } catch (error: any) {
      console.error('加载数据失败:', error)
      // 如果加载失败，显示空数据
      const emptyRows = campusList.map((campus, idx) => makeEmptyRow(campus, idx + 1))
      const total = makeEmptyRow('合计', '合计', true)
      setTotalRow(total)
      emptyRows.push(total)
      setRows(emptyRows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [year])

  const renderValue = (value: any, isTotal: boolean) => {
    const empty = value === null || value === undefined || value === ''
    if (empty) return isTotal ? 0 : '' // 合计行显示0，普通行显示空
    return (
      <span style={{ fontWeight: isTotal ? 'bold' : 'normal', color: 'inherit' }}>
        {value}
      </span>
    )
  }

  // 神殿表格列配置
  const campusColumns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      align: 'center' as const,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      align: 'center' as const,
    },
    {
      title: '咨询师',
      children: [
        {
          title: '咨询总职数',
          dataIndex: 'consultTotal',
          key: 'consultTotal',
          width: 90,
          align: 'center' as const,
          render: (val: any, record: CampusRow) => renderValue(val, record.isTotal),
        },
        {
          title: '咨询干部职数',
          dataIndex: 'consultManager',
          key: 'consultManager',
          width: 90,
          align: 'center' as const,
          render: (val: any, record: CampusRow) => renderValue(val, record.isTotal),
        },
        {
          title: '咨询员工职数',
          dataIndex: 'consultStaff',
          key: 'consultStaff',
          width: 90,
          align: 'center' as const,
          render: (val: any, record: CampusRow) => renderValue(val, record.isTotal),
        },
      ],
    },
    {
      title: '渠道职数',
      children: [
        {
          title: '渠道总职数',
          dataIndex: 'channelTotal',
          key: 'channelTotal',
          width: 80,
          align: 'center' as const,
          render: (val: any, record: CampusRow) => renderValue(val, record.isTotal),
        },
        {
          title: '县办',
          dataIndex: 'countyOffice',
          key: 'countyOffice',
          width: 60,
          align: 'center' as const,
          render: (val: any, record: CampusRow) => renderValue(val, record.isTotal),
        },
        {
          title: '乡办',
          dataIndex: 'townOffice',
          key: 'townOffice',
          width: 60,
          align: 'center' as const,
          render: (val: any, record: CampusRow) => renderValue(val, record.isTotal),
        },
        {
          title: '信息员',
          dataIndex: 'informer',
          key: 'informer',
          width: 60,
          align: 'center' as const,
          render: (val: any, record: CampusRow) => renderValue(val, record.isTotal),
        },
      ],
    },
  ]

  // 自定义头部组件
  const CustomHeader = ({ title, fontSize = '16px' }: { title: string, fontSize?: string }) => (
    <div style={{
      backgroundColor: '#ffc000',
      color: '#000',
      fontWeight: 'bold',
      textAlign: 'center',
      padding: '8px',
      border: '1px solid #000',
      fontSize: fontSize
    }}>
      {title}
    </div>
  )

  const TopSummaryTable = () => {
    if (!totalRow) return null
    return (
      <div style={{ marginBottom: 20 }}>
        <CustomHeader title={`清美教育集团${year}年人员职数`} />
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ border: '1px solid #000', backgroundColor: '#e2efda', width: '150px' }}>清美教育集团</th>
              <th colSpan={3} style={{ border: '1px solid #000', backgroundColor: '#e2efda' }}>咨询师职数</th>
              <th colSpan={4} style={{ border: '1px solid #000', backgroundColor: '#e2efda' }}>渠道职数</th>
            </tr>
            <tr>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda' }}>咨询总职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda' }}>咨询干部职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda' }}>咨询员工职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda' }}>渠道总职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda' }}>县办</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda' }}>乡办</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda' }}>信息员</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', fontWeight: 'bold' }}>{renderValue(totalRow.consultTotal, true)}</td>
              <td style={{ border: '1px solid #000', fontWeight: 'bold' }}>{renderValue(totalRow.consultManager, true)}</td>
              <td style={{ border: '1px solid #000', fontWeight: 'bold' }}>{renderValue(totalRow.consultStaff, true)}</td>
              <td style={{ border: '1px solid #000', fontWeight: 'bold' }}>{renderValue(totalRow.channelTotal, true)}</td>
              <td style={{ border: '1px solid #000', fontWeight: 'bold' }}>{renderValue(totalRow.countyOffice, true)}</td>
              <td style={{ border: '1px solid #000', fontWeight: 'bold' }}>{renderValue(totalRow.townOffice, true)}</td>
              <td style={{ border: '1px solid #000', fontWeight: 'bold' }}>{renderValue(totalRow.informer, true)}</td>
              {/* Note: The first cell "清美教育集团" spans 2 rows in header, so data row just needs to align. 
                  Wait, the header has a rowspan. The data row should have a cell for the first column if it's not part of the headers.
                  In the image, "清美教育集团" is a header cell spanning 2 rows. 
                  Below it, there is a data row. The data row has values. What is in the first column of the data row?
                  The image shows:
                  Header: "清美教育集团"
                  Data Row: 38 11 27 1087 50 355 789
                  It seems the data row has 7 values, but there are 8 columns if we count "清美教育集团". 
                  The value "38" is under "咨询总职数".
                  So the data row matches distinct columns 2-8. The first column "清美教育集团" effectively acts as a label for the row?
                  Or does the data row span across?
                  Actually looking at the image:
                  Row 1: Title
                  Row 2, 3: Headers. "清美教育集团" is on the left.
                  Row 4: Data. The first cell is empty or merged?
                  Wait, the image shows "38" under "咨询总职数". There is nothing under "清美教育集团" in the data row.
                  It looks like the "清美教育集团" cell might span 3 rows (Header 1, Header 2, Data)?
                  No, usually it's just a label.
                  Let's assume the first column in the data row should be empty or describing the row?
                  But the numbers 38, 11 etc align with the sub-headers.
                  So I need an empty cell or merged cell for the first column.
                  I'll put an empty cell there.
               */}
               <td style={{ border: '1px solid #000' }}></td> {/* Placeholder for first column if needed, but actually the layout might be different. */}
               {/* 
                  Let's re-examine image Top Table.
                  Header: [清美教育集团 (rowspan=2)] [咨询师职数 (colspan=3)] [渠道职数 (colspan=4)]
                  Sub-Header: [咨询总职数] [咨询干部] [员工] [渠道总] [县] [乡] [信息]
                  Data Row:   [    38    ] [   11   ] [ 27 ] [ 1087 ] [50] [355] [789]
                  
                  Wait, where is the cell for the first column in the data row?
                  It looks like the 38 is under "咨询总职数".
                  So under "清美教育集团", it is blank or the "清美教育集团" block rowspan covers the data row as well?
                  If "清美教育集团" rowspan=3, then the data row starts from column 2.
                  Let's try that.
               */}
            </tr>
          </tbody>
        </table>
        {/* Correcting the table structure based on re-evaluation */}
         <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center',tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th rowSpan={2} style={{ border: '1px solid #000', backgroundColor: '#e2efda', width: '15%', verticalAlign: 'middle' }}>清美教育集团</th>
              <th colSpan={3} style={{ border: '1px solid #000', backgroundColor: '#e2efda', height: '30px' }}>咨询师职数</th>
              <th colSpan={4} style={{ border: '1px solid #000', backgroundColor: '#e2efda', height: '30px' }}>渠道职数</th>
            </tr>
            <tr>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', height: '30px' }}>咨询总职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', height: '30px' }}>咨询干部职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', height: '30px' }}>咨询员工职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', height: '30px' }}>渠道总职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', height: '30px' }}>县办</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', height: '30px' }}>乡办</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', height: '30px' }}>信息员</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ height: '40px' }}>
               <td style={{ border: '1px solid #000', backgroundColor: '#e2efda' }}></td> {/* Empty cell under Group Name if not merged, or maybe I should merge the header to cover this? 
               actually, if I make the header rowspan=3, it will look like the label for the data.
               Let's try rowspan=3 for the first th.
               */} 
               {/* 
                  Wait, if I use rowspan=3 on the first TH, then I don't need a TD in the data row for the first column.
                  Let's do that.
               */}
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  // Revised TopSummaryTable to use single table approach for rowspan
  const RealTopSummaryTable = () => {
    if (!totalRow) return null
    return (
      <div style={{ marginBottom: 20 }}>
        <CustomHeader title={`清美教育集团${year}年人员职数`} />
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', tableLayout: 'fixed' }}>
           <colgroup>
             <col style={{ width: '12%' }} />
             <col style={{ width: '12%' }} />
             <col style={{ width: '12%' }} />
             <col style={{ width: '12%' }} />
             <col style={{ width: '12%' }} />
             <col style={{ width: '12%' }} />
             <col style={{ width: '12%' }} />
             <col style={{ width: '16%' }} />
           </colgroup>
          <thead>
            <tr>
              <th rowSpan={2} style={{ border: '1px solid #000', backgroundColor: '#e2efda', verticalAlign: 'middle', fontSize: '14px' }}>清美教育集团</th>
              <th colSpan={3} style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>咨询师职数</th>
              <th colSpan={4} style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>渠道职数</th>
            </tr>
            <tr>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>咨询总职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>咨询干部职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>咨询员工职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>渠道总职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>县办</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>乡办</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>信息员</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
              <td style={{ border: '1px solid #000', padding: '10px' }}></td> {/* Matches the first column? Or maybe the first column header should just span down? 
              If the first column header spans 2 rows, then this row needs a cell for the first column unless the header spans 3 rows.
              Let's make the data cell for the first column empty but present to maintain grid.
              The text "清美教育集团" acts as the label.
              */}
              <td style={{ border: '1px solid #000' }}>{renderValue(totalRow.consultTotal, true)}</td>
              <td style={{ border: '1px solid #000' }}>{renderValue(totalRow.consultManager, true)}</td>
              <td style={{ border: '1px solid #000' }}>{renderValue(totalRow.consultStaff, true)}</td>
              <td style={{ border: '1px solid #000' }}>{renderValue(totalRow.channelTotal, true)}</td>
              <td style={{ border: '1px solid #000' }}>{renderValue(totalRow.countyOffice, true)}</td>
              <td style={{ border: '1px solid #000' }}>{renderValue(totalRow.townOffice, true)}</td>
              <td style={{ border: '1px solid #000' }}>{renderValue(totalRow.informer, true)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  // Adjusting to match picture perfectly:
  // In picture, the first column "清美教育集团" spans the whole height (Header + Data).
  // So RowSpan should be 3 (Header Row 1, Header Row 2, Data Row).
  
   const FinalTopSummaryTable = () => {
    if (!totalRow) return null
    return (
      <div style={{ marginBottom: 20 }}>
        <CustomHeader title={`清美教育集团${year}年人员职数`} />
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th rowSpan={3} style={{ border: '1px solid #000', backgroundColor: '#e2efda', verticalAlign: 'middle', fontSize: '16px', width: '150px' }}>清美教育集团</th>
              <th colSpan={3} style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>咨询师职数</th>
              <th colSpan={4} style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>渠道职数</th>
            </tr>
            <tr>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>咨询总职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>咨询干部职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>咨询员工职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>渠道总职数</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>县办</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>乡办</th>
              <th style={{ border: '1px solid #000', backgroundColor: '#e2efda', padding: '8px' }}>信息员</th>
            </tr>
            <tr style={{ backgroundColor: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
              <td style={{ border: '1px solid #000', padding: '10px' }}>{renderValue(totalRow.consultTotal, true)}</td>
              <td style={{ border: '1px solid #000' }}>{renderValue(totalRow.consultManager, true)}</td>
              <td style={{ border: '1px solid #000' }}>{renderValue(totalRow.consultStaff, true)}</td>
              <td style={{ border: '1px solid #000' }}>{renderValue(totalRow.channelTotal, true)}</td>
              <td style={{ border: '1px solid #000' }}>{renderValue(totalRow.countyOffice, true)}</td>
              <td style={{ border: '1px solid #000' }}>{renderValue(totalRow.townOffice, true)}</td>
              <td style={{ border: '1px solid #000' }}>{renderValue(totalRow.informer, true)}</td>
            </tr>
          </thead>
        </table>
      </div>
    )
  }

  return (
    <Spin spinning={loading} tip="加载中...">
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <span 
            onClick={loadData} 
            style={{ cursor: 'pointer', color: '#1890ff' }}
            title="刷新数据"
          >
            <ReloadOutlined /> 刷新
          </span>
        </div>

        <FinalTopSummaryTable />

        <div style={{ marginBottom: 20 }}>
            <CustomHeader title={`清美教育集团${year}年度核心数据看板汇总`} fontSize="20px" />
            <Table
                columns={campusColumns as any}
                dataSource={rows}
                pagination={false}
                bordered
                size="middle"
                rowKey="key"
                showHeader={true}
                className="custom-table"
                rowClassName={(record) => {
                    if (record.campus === '盛邦') return 'highlight-row'; // Assuming Sheng Bang is highlighted as per image
                    if (record.isTotal) return 'total-row';
                    return '';
                }}
            />
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
          提示：此汇总表数据来自"02各神殿人员职数明细"，请在各神殿TAB中填写数据后自动汇总
        </div>

        <style>{`
          .custom-table .ant-table-thead > tr > th {
            background-color: #e2efda !important;
            text-align: center !important;
            font-weight: bold !important;
            border: 1px solid #000 !important;
            color: #000 !important;
          }
          .custom-table .ant-table-tbody > tr > td {
            border: 1px solid #000 !important;
            text-align: center !important;
            color: #000 !important;
          }
          .custom-table .ant-table-container {
             border: 1px solid #000 !important;
          }
          .highlight-row > td {
            background-color: #ffff00 !important;
          }
           .total-row > td {
            background-color: #fff !important;
            font-weight: bold;
          }
        `}</style>
      </div>
    </Spin>
  )
}

// 主页面组件
export default function ConsultStaffingPage() {
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (!date) return
    setYear(date.format('YYYY'))
  }

  const tabItems = [
    {
      key: '1',
      label: '01最高议事厅核心数据汇总',
      children: <Tab1Summary year={year} />,
    },
    {
      key: '2',
      label: '02各神殿人员职数明细',
      children: <Tab2CampusStaffingDetail />,
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Card
        title={
          <span>
            <FileTextOutlined style={{ marginRight: 8 }} />
            010咨询和渠道职数
          </span>
        }
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>选择年份：</span>
            <DatePicker
              picker="year"
              value={dayjs(year, 'YYYY')}
              onChange={handleYearChange}
              allowClear={false}
              style={{ width: 120 }}
              format="YYYY年"
            />
          </div>
        }
      >
        <Tabs defaultActiveKey="1" items={tabItems} />
      </Card>
    </NoCopyContainer>
  )
}
