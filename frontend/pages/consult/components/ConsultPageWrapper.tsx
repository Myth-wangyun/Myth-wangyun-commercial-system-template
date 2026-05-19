/**
 * 祈福司门页面布局包装器
 * 自动应用禁止复制等安全策略
 */

import React from 'react'
import NoCopyContainer from '@/components/common/NoCopyContainer'

interface ConsultPageWrapperProps {
  children: React.ReactNode
  /** 是否禁用复制保护，默认 false（即默认启用保护） */
  disableProtection?: boolean
  /** 自定义样式 */
  style?: React.CSSProperties
  /** 自定义类名 */
  className?: string
}

/**
 * 祈福司门页面包装器
 * 
 * 功能：
 * 1. 禁止页面内容复制
 * 2. 禁止右键菜单
 * 3. 禁止文本选择
 * 
 * 使用方式：
 * ```tsx
 * export default function SomePage() {
 *   return (
 *     <ConsultPageWrapper>
 *       <Card>...</Card>
 *       <Table>...</Table>
 *     </ConsultPageWrapper>
 *   )
 * }
 * ```
 */
const ConsultPageWrapper: React.FC<ConsultPageWrapperProps> = ({
  children,
  disableProtection = false,
  style,
  className,
}) => {
  return (
    <NoCopyContainer
      enabled={!disableProtection}
      warningMessage="祈福司门数据禁止复制"
      style={style}
      className={className}
    >
      {children}
    </NoCopyContainer>
  )
}

export default ConsultPageWrapper
