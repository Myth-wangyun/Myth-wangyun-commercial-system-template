import React from 'react'
import { Breadcrumb } from 'antd'
import { HomeOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'

interface BreadcrumbItem {
  title: string
  path?: string
  icon?: React.ReactNode
}

interface CustomBreadcrumbProps {
  items?: BreadcrumbItem[]
  showHome?: boolean
  homePath?: string
  homeTitle?: string
  separator?: string
  style?: React.CSSProperties
  className?: string
}

const CustomBreadcrumb: React.FC<CustomBreadcrumbProps> = ({
  items = [],
  showHome = true,
  homePath = '/',
  homeTitle = '首页',
  separator = '/',
  style,
  className,
}) => {
  const location = useLocation()
  const navigate = useNavigate()

  // 根据路由自动生成面包屑
  const generateBreadcrumbFromPath = (pathname: string): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbItems: BreadcrumbItem[] = []

    let currentPath = ''
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`
      const title = segment.charAt(0).toUpperCase() + segment.slice(1)
      breadcrumbItems.push({
        title,
        path: currentPath,
      })
    })

    return breadcrumbItems
  }

  const handleClick = (path: string) => {
    if (path) {
      navigate(path)
    }
  }

  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbFromPath(location.pathname)

  const finalItems = showHome
    ? [
        {
          title: (
            <span onClick={() => handleClick(homePath)} style={{ cursor: 'pointer' }}>
              <HomeOutlined />
              <span style={{ marginLeft: 4 }}>{homeTitle}</span>
            </span>
          ),
        },
        ...breadcrumbItems.map((item) => ({
          title: item.path ? (
            <span onClick={() => handleClick(item.path!)} style={{ cursor: 'pointer' }}>
              {item.icon && <span style={{ marginRight: 4 }}>{item.icon}</span>}
              {item.title}
            </span>
          ) : (
            <span>
              {item.icon && <span style={{ marginRight: 4 }}>{item.icon}</span>}
              {item.title}
            </span>
          ),
        })),
      ]
    : breadcrumbItems.map((item) => ({
        title: item.path ? (
          <span onClick={() => handleClick(item.path!)} style={{ cursor: 'pointer' }}>
            {item.icon && <span style={{ marginRight: 4 }}>{item.icon}</span>}
            {item.title}
          </span>
        ) : (
          <span>
            {item.icon && <span style={{ marginRight: 4 }}>{item.icon}</span>}
            {item.title}
          </span>
        ),
      }))

  return <Breadcrumb items={finalItems} separator={separator} style={style} className={className} />
}

export default CustomBreadcrumb
