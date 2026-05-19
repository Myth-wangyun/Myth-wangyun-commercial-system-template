import React, { memo, useCallback, useMemo } from 'react'
import { Breadcrumb } from 'antd'

interface BreadcrumbItem {
  title: string
  href?: string
  onClick?: () => void
  icon?: React.ReactNode
}

interface OptimizedBreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: string | React.ReactNode
  style?: React.CSSProperties
  className?: string
}

const OptimizedBreadcrumb: React.FC<OptimizedBreadcrumbProps> = memo(
  ({ items, separator = '/', style, className }) => {
    const handleClick = useCallback((onClick?: () => void) => {
      if (onClick) {
        onClick()
      }
    }, [])

    const breadcrumbItems = useMemo(() => {
      return items.map((item, index) => ({
        key: index,
        title: item.title,
        href: item.href,
        onClick: () => handleClick(item.onClick),
        icon: item.icon,
      }))
    }, [items, handleClick])

    const breadcrumbProps = useMemo(
      () => ({
        items: breadcrumbItems,
        separator,
        style,
        className,
      }),
      [breadcrumbItems, separator, style, className],
    )

    return <Breadcrumb {...breadcrumbProps} />
  },
)

OptimizedBreadcrumb.displayName = 'OptimizedBreadcrumb'

export default OptimizedBreadcrumb
