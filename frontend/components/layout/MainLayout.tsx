import React from 'react'
import { Outlet } from 'react-router-dom'
import { Layout } from 'antd'
import Navbar from '../Navbar'
import Sidebar from '../Sidebar'
import { useCampusStore } from '@/stores/campusStore'

const { Content } = Layout

const MainLayout: React.FC = () => {
  const { loadCampusesFromConfig } = useCampusStore()

  React.useEffect(() => {
    loadCampusesFromConfig()
  }, [loadCampusesFromConfig])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navbar />
      <Layout>
        <Sidebar />
        <Layout>
          <Content style={{ padding: 0, background: '#f5f5f5' }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default MainLayout
