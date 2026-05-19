import React, { useMemo, useState, useEffect, Suspense } from 'react'
import { Card, List, Input, Typography, Space, Button, App } from 'antd'
import { useSearchParams } from 'react-router-dom'

type ModuleLoader = () => Promise<any>

// 收集 pages 目录中的页面入口：根下的 *.tsx 和各子目录的 index.tsx（按需加载）
const pageModules: Record<string, ModuleLoader> = import.meta.glob([
  '../pages/*.tsx',
  '../pages/**/index.tsx',
  // 排除内层组件与部分未完善页面，避免构建期无效依赖导致失败
  '!../pages/**/components/**',
  '!../pages/**/__tests__/**',
  '!../pages/academic/**',
])

const isReactComponent = (mod: any) => {
  const c = mod?.default
  return typeof c === 'function' || (typeof c === 'object' && c !== null)
}

const PageLoader: React.FC = () => {
  const { message } = App.useApp()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState('')
  const [activePath, setActivePath] = useState<string | null>(null)
  const [LoadedComp, setLoadedComp] = useState<React.ComponentType | null>(null)

  // 初始化：从 URL 参数预选路径 ?path=../pages/xxx.tsx
  useEffect(() => {
    const p = params.get('path')
    if (p && pageModules[p]) {
      setActivePath(p)
      void loadComponent(p)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allPaths = useMemo(() => Object.keys(pageModules).sort(), [])

  const visiblePaths = useMemo(() => {
    if (!filter.trim()) return allPaths
    const q = filter.toLowerCase()
    return allPaths.filter((p) => p.toLowerCase().includes(q))
  }, [allPaths, filter])

  const loadComponent = async (path: string) => {
    try {
      const loader = pageModules[path]
      if (!loader) {
        message.error('未找到模块: ' + path)
        return
      }
      const mod = await loader()
      if (!isReactComponent(mod)) {
        message.warning('该文件未导出默认 React 组件，尝试直接渲染模块对象')
      }
      setLoadedComp(() => mod.default ?? null)
      setActivePath(path)
      params.set('path', path)
      setParams(params, { replace: true })
    } catch (err: any) {
      console.error(err)
      message.error('加载失败: ' + (err?.message || String(err)))
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>
      <Card title="页面选择" style={{ height: 'calc(100vh - 48px)', overflow: 'hidden' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="筛选路径（输入关键字）"
            allowClear
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
            <List
              size="small"
              bordered
              dataSource={visiblePaths}
              renderItem={(item) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    background: item === activePath ? '#e6f7ff' : undefined,
                  }}
                  onClick={() => loadComponent(item)}
                >
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Typography.Text ellipsis style={{ maxWidth: 260 }}>
                      {item}
                    </Typography.Text>
                    <Button size="small" type={item === activePath ? 'primary' : 'default'}>
                      加载
                    </Button>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        </Space>
      </Card>

      <Card title={activePath ? `预览 - ${activePath}` : '预览'} style={{ minHeight: '60vh' }}>
        <div style={{ minHeight: 320 }}>
          {LoadedComp ? (
            <Suspense fallback={<div>加载中...</div>}>
              <LoadedComp />
            </Suspense>
          ) : (
            <Typography.Text type="secondary">请选择左侧列表中的页面进行加载预览</Typography.Text>
          )}
        </div>
      </Card>
    </div>
  )
}

export default PageLoader
