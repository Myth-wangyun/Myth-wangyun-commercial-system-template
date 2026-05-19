import React, { lazy, useMemo } from 'react'
import { Typography, Tabs, Segmented } from 'antd'
import LazySection from '@/pages/academic/mgnt/LazySection'
import AllCampusLevelPagesATQ from './campus-level/AllCampusLevelPages'
import { getCampusOptions } from '@/config/campusConfig'
import { useCampusStore } from '@/stores/campusStore'
import { sortCampuses } from '@/utils/campusSort'

const { Title } = Typography

// 懒加载 mgnt2 下 001-013 的页面
const P1 = lazy(() => import('./001-teaching-quality-summary'))
const P2 = lazy(() => import('./002-backend-employment-goals-results'))
const P3 = lazy(() => import('./003-enterprise-contract-goals-results'))
const P4 = lazy(() => import('./004-reputation-enrollment-goals-results'))
const P5 = lazy(() => import('./005-new-student-stability'))
const P6 = lazy(() => import('./006-enrollment-plan'))
const P7 = lazy(() => import('./007-student-fluctuation'))
const P8 = lazy(() => import('./008-dormitory-management'))
const P9 = lazy(() => import('./009-student-status'))
const P10 = lazy(() => import('./010-manager-function-analysis'))
const P11 = lazy(() => import('./011-training-plan-performance'))
const P12 = lazy(() => import('./012-teacher-staffing-ratio'))
const P13 = lazy(() => import('./013-recruitment-plan-summary'))

interface SummaryContentProps {
  campus?: string
}

const SummaryContent: React.FC<SummaryContentProps> = ({ campus }) => (
  <div>
    <Title level={3}>教化司 · 核心业务数据汇总</Title>
    <LazySection id="p1" title="001. 核心数据汇总" component={P1} componentProps={{ campus }} />
    <LazySection id="p2" title="002. 就业目标与结果" component={P2} componentProps={{ campus }} />
    <LazySection id="p3" title="003. 企业签约目标与结果" component={P3} componentProps={{ campus }} />
    <LazySection id="p4" title="004. 口碑招生目标与结果" component={P4} componentProps={{ campus }} />
    <LazySection id="p5" title="005. 新生维稳" component={P5} componentProps={{ campus }} />
    <LazySection id="p6" title="006. 升学计划" component={P6} componentProps={{ campus }} />
    <LazySection id="p7" title="007. 学员异动" component={P7} componentProps={{ campus }} />
    <LazySection id="p8" title="008. 宿舍管理" component={P8} componentProps={{ campus }} />
    <LazySection id="p9" title="009. 学籍统计" component={P9} componentProps={{ campus }} />
    <LazySection id="p10" title="010. 经理功能分析" component={P10} componentProps={{ campus }} />
    <LazySection id="p11" title="011. 培训计划与成绩" component={P11} componentProps={{ campus }} />
    <LazySection id="p12" title="012. 师资配比" component={P12} componentProps={{ campus }} />
    <LazySection id="p13" title="013. 招聘计划与总结" component={P13} componentProps={{ campus }} />
  </div>
)

const ATQTeachingQualityMgnt2All: React.FC = () => {
  const { currentCampus, setCampus } = useCampusStore()
  const [activeKey, setActiveKey] = React.useState<string>('summary')

  const campusOptions = useMemo(
    () => {
      const options = getCampusOptions().map(({ label }) => ({
        label: label.replace(/神殿$/, ''),
        value: label,
      }))
      // 使用 sortCampuses 对神殿选项进行排序
      return sortCampuses(options, 'label')
    },
    [],
  )

  // 显示神殿选择器在两个标签页都显示
  const extra = (
    <Segmented
      options={campusOptions}
      value={currentCampus || campusOptions[0]?.value}
      onChange={(val) => setCampus(String(val))}
    />
  )

  return (
    <div style={{ padding: 24 }}>
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        tabBarExtraContent={extra}
        items={[
          {
            key: 'summary',
            label: '汇总',
            children: <SummaryContent campus={currentCampus || undefined} />,
          },
          {
            key: 'campus',
            label: '神殿层级（整合）',
            children: <AllCampusLevelPagesATQ hideCampusSelector />,
          },
        ]}
      />
    </div>
  )
}

export default ATQTeachingQualityMgnt2All
