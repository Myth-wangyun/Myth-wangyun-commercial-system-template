/**
 * CampusSelector 组件测试页面
 * 展示各种使用场景
 */

import React, { useState } from 'react'
import { App, Card, Row, Col, Divider, Space, Typography } from 'antd'
import CampusSelector, { GlobalCampusSelector } from '@/components/common/CampusSelector'

const { Title, Paragraph, Text } = Typography

const CampusSelectorDemo: React.FC = () => {
  const { message } = App.useApp()
  // 受控组件状态
  const [controlledValue, setControlledValue] = useState<string>('')
  const mockCampuses = [
    { id: '1', name: '测试神殿A' },
    { id: '2', name: '测试神殿B' },
    { id: '3', name: '测试神殿C' },
  ]

  // 自定义添加逻辑
  const handleCustomAdd = async (data: { name: string }) => {
    console.log('自定义添加逻辑:', data)
    await new Promise((resolve) => setTimeout(resolve, 1000)) // 模拟 API 调用
    message.success(`已添加神殿：${data.name}`)
  }

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={2}>CampusSelector 组件示例</Title>
      <Paragraph>这是统一的神殿选择器组件，支持全局状态和受控组件两种模式。</Paragraph>

      <Row gutter={[16, 16]}>
        {/* 场景1：基础使用 - 全局状态 */}
        <Col span={24}>
          <Card title="场景1：全局状态模式 - 基础使用" hoverable>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">最简单的使用方式，自动从全局状态获取和设置神殿</Text>
              <CampusSelector useGlobalState />

              <Divider />
              <Text code>{`<CampusSelector useGlobalState />`}</Text>
            </Space>
          </Card>
        </Col>

        {/* 场景2：带标签显示 */}
        <Col span={12}>
          <Card title="场景2：带标签显示" hoverable>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">显示当前选中的神殿标签</Text>
              <CampusSelector useGlobalState showTag />

              <Divider />
              <Text code>{`<CampusSelector useGlobalState showTag />`}</Text>
            </Space>
          </Card>
        </Col>

        {/* 场景3：紧凑模式 */}
        <Col span={12}>
          <Card title="场景3：紧凑模式" hoverable>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">小尺寸，不显示标签文字</Text>
              <CampusSelector
                useGlobalState
                size="small"
                showLabel={false}
                style={{ width: 120 }}
              />

              <Divider />
              <Text code style={{ fontSize: 11 }}>
                {`<CampusSelector useGlobalState size="small" showLabel={false} style={{width: 120}} />`}
              </Text>
            </Space>
          </Card>
        </Col>

        {/* 场景4：添加功能 - 外部按钮 */}
        <Col span={12}>
          <Card title="场景4：添加神殿 - 外部按钮" hoverable>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">在选择器旁边显示添加按钮</Text>
              <CampusSelector useGlobalState showAddButton addButtonPosition="outside" />

              <Divider />
              <Text code style={{ fontSize: 11 }}>
                {`<CampusSelector useGlobalState showAddButton addButtonPosition="outside" />`}
              </Text>
            </Space>
          </Card>
        </Col>

        {/* 场景5：添加功能 - 内部按钮 */}
        <Col span={12}>
          <Card title="场景5：添加神殿 - 下拉菜单内" hoverable>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">在下拉菜单底部显示添加按钮</Text>
              <CampusSelector useGlobalState showAddButton addButtonPosition="inside" />

              <Divider />
              <Text code style={{ fontSize: 11 }}>
                {`<CampusSelector useGlobalState showAddButton addButtonPosition="inside" />`}
              </Text>
            </Space>
          </Card>
        </Col>

        {/* 场景6：受控组件模式 */}
        <Col span={12}>
          <Card title="场景6：受控组件模式" hoverable>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">自己管理状态和数据源</Text>
              <CampusSelector
                value={controlledValue}
                onChange={setControlledValue}
                campuses={mockCampuses}
              />
              <Text>当前选中：{controlledValue || '未选择'}</Text>

              <Divider />
              <Text code style={{ fontSize: 11 }}>
                {`<CampusSelector value={value} onChange={setValue} campuses={list} />`}
              </Text>
            </Space>
          </Card>
        </Col>

        {/* 场景7：自定义添加逻辑 */}
        <Col span={12}>
          <Card title="场景7：自定义添加逻辑" hoverable>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">使用自定义的添加神殿逻辑（例如调用API）</Text>
              <CampusSelector
                useGlobalState
                showAddButton
                onAddCampus={handleCustomAdd}
                addButtonText="新建神殿"
              />

              <Divider />
              <Text code style={{ fontSize: 10 }}>
                {`<CampusSelector useGlobalState showAddButton onAddCampus={handleCustomAdd} />`}
              </Text>
            </Space>
          </Card>
        </Col>

        {/* 场景8：完整配置 */}
        <Col span={24}>
          <Card title="场景8：完整配置" hoverable>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">展示所有功能：标签、大尺寸、添加按钮</Text>
              <CampusSelector
                useGlobalState
                showTag
                showAddButton
                size="large"
                addButtonPosition="outside"
                placeholder="请选择您的神殿"
              />

              <Divider />
              <Text code style={{ fontSize: 10 }}>
                {`<CampusSelector useGlobalState showTag showAddButton size="large" addButtonPosition="outside" />`}
              </Text>
            </Space>
          </Card>
        </Col>

        {/* 场景9：使用便捷导出 */}
        <Col span={24}>
          <Card title="场景9：使用便捷导出 GlobalCampusSelector" hoverable>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">使用便捷导出，不需要传 useGlobalState prop</Text>
              <GlobalCampusSelector showTag />

              <Divider />
              <Text code>
                {`import { GlobalCampusSelector } from '@/components/common/CampusSelector';`}
              </Text>
              <Text code>{`<GlobalCampusSelector showTag />`}</Text>
            </Space>
          </Card>
        </Col>

        {/* 使用说明 */}
        <Col span={24}>
          <Card title="📖 使用说明" type="inner">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={5}>替换现有的 CampusSelector</Title>
              <Paragraph>
                1. 删除本地的 <Text code>components/CampusSelector.tsx</Text> 文件
                <br />
                2. 将导入路径改为 <Text code>@/components/common/CampusSelector</Text>
                <br />
                3. 根据使用场景选择合适的 props 配置
              </Paragraph>

              <Title level={5}>两种模式对比</Title>
              <Paragraph>
                <Text strong>全局状态模式：</Text>适用于大部分场景，数据自动同步
                <br />
                <Text strong>受控组件模式：</Text>适用于需要自定义数据源或逻辑的场景
              </Paragraph>

              <Title level={5}>详细文档</Title>
              <Paragraph>
                查看 <Text code>frontend/components/common/README_CampusSelector.md</Text>{' '}
                获取完整文档
              </Paragraph>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default CampusSelectorDemo
