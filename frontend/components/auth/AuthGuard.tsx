import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/auth'

interface AuthGuardProps {
  children: React.ReactNode
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, refreshSession, user } = useAuthStore()
  const location = useLocation()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let active = true
    
    // 如果已经有用户信息，直接通过验证
    if (user) {
      setChecked(true)
      return
    }
    
    // 如果已有 token，尝试获取用户信息
    const currentState = useAuthStore.getState()
    if (currentState.token) {
      authService.getMe()
        .then(userData => {
          if (active) {
            useAuthStore.getState().setUser({
              id: String(userData.user_id),
              username: userData.username,
              name: userData.real_name,
              role: userData.role,
              is_superuser: userData.is_superuser,
              campus: userData.campus ?? null,
              campusAccessList: userData.campus_access_list ?? [],
              department: userData.department ?? null,
              position: userData.position ?? null,
              email: userData.email ?? null,
            })
            setChecked(true)
          }
        })
        .catch(() => {
          if (active) {
            refreshSession().finally(() => {
              if (active) setChecked(true)
            })
          }
        })
    } else {
      // 没有 token，使用 refreshSession
      refreshSession().finally(() => {
        if (active) setChecked(true)
      })
    }
    
    return () => {
      active = false
    }
  }, [refreshSession, user])

  // 如果正在加载，显示加载动画（只依赖本地 checked，避免全局 loading 导致永久 spinner）
  if (!checked) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
        }}
      >
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#666' }}>正在验证身份...</div>
      </div>
    )
  }

  // 如果未认证，重定向到登录页
  if (!isAuthenticated) {
    const redirectPath = `${location.pathname}${location.search}${location.hash}`
    if (!redirectPath.startsWith('/login')) {
      sessionStorage.setItem('auth.redirect', redirectPath)
    }
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 如果已认证，渲染子组件
  return <>{children}</>
}

export default AuthGuard
