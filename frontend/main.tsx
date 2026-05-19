import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
const App = React.lazy(() => import('./App'))
import './style.css'
import { API_BASE } from './utils/apiBase'
import { useAuthStore } from './stores/authStore'
import { setAuthStoreGetter } from './services/api'

// 设置 api.ts 的 authStore getter，解决循环依赖问题
setAuthStoreGetter(() => useAuthStore.getState())

dayjs.locale('zh-cn')

// 全局拦截 fetch，自动为后端 API 请求添加 API Key 和 JWT Token
// 这样所有使用 fetch 调用 API 的地方都会自动带上认证信息，无需逐个修改
const originalFetch = window.fetch.bind(window);
let refreshPromise: Promise<string | null> | null = null;
const storeRedirectPath = () => {
  const redirectPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (!redirectPath.startsWith('/login')) {
    sessionStorage.setItem('auth.redirect', redirectPath);
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }
  refreshPromise = (async () => {
    try {
      const response = await originalFetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      const token = data?.access_token as string | undefined;
      if (token) {
        useAuthStore.getState().setToken(token);
        return token;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
};

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  
  // 只对后端 API 请求添加认证信息
  if (url.includes('/api/v1') || url.includes(API_BASE) || url.includes('localhost:8000') || url.includes(':8000/api')) {
    const headers = new Headers(init?.headers || {});
    
    // 添加 JWT Token（第二层防护 - 强制登录认证）
    if (!headers.has('Authorization')) {
      const token = useAuthStore.getState().token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    
    const fetchInit = { ...init, headers, credentials: 'include' } as RequestInit & { _retry?: boolean };
    const response = await originalFetch(input, fetchInit);

    if (response.status === 401 && !fetchInit._retry) {
      const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/refresh');
      if (!isAuthRequest) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          const retryHeaders = new Headers(headers);
          retryHeaders.set('Authorization', `Bearer ${newToken}`);
          const retryInit = { ...fetchInit, headers: retryHeaders, _retry: true } as RequestInit;
          return originalFetch(input, retryInit);
        }
        if (!window.location.pathname.includes('/login')) {
          console.warn('[认证] 令牌验证失败，跳转到登录页');
          useAuthStore.getState().logout();
          storeRedirectPath();
          window.location.href = '/login';
        }
      }
    }
    
    return response;
  }
  
  return originalFetch(input, init);
};

// 全局未捕获异常处理（仅生产环境生效）
// 这些是 lazyWithRetry + AppRouteError 的最后一道防线
if (import.meta.env.PROD) {
  // 处理脚本加载错误（如 chunk 加载失败 —— <script> 标签层面）
  window.addEventListener('error', (event) => {
    if (event.target && (event.target as HTMLElement).tagName === 'SCRIPT') {
      console.error('[全局异常处理] 脚本加载失败，自动刷新页面')
      const lastReload = sessionStorage.getItem('lazy_chunk_reload_ts')
      const now = Date.now()
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem('lazy_chunk_reload_ts', String(now))
        window.location.reload()
      }
    }
  }, true)

  // 处理动态 import() 的 chunk 加载失败（Promise rejection 层面）
  // 这是 lazyWithRetry 的兜底 —— 以防有漏网的动态 import
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '')
    const isChunkError =
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('Loading CSS chunk') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('Importing a module script failed')
    if (isChunkError) {
      event.preventDefault()
      console.warn('[全局异常处理] 动态 import chunk 失败，自动刷新页面')
      const lastReload = sessionStorage.getItem('lazy_chunk_reload_ts')
      const now = Date.now()
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem('lazy_chunk_reload_ts', String(now))
        window.location.reload()
      }
    }
  })
}

const rootElement = document.getElementById('app')!
const root = ReactDOM.createRoot(rootElement)

const renderApp = (Wrapper?: React.ComponentType<{ children: React.ReactNode }>) => {
  const appElement = (
    <Suspense fallback={null}>
      <App />
    </Suspense>
  )
  root.render(
    <React.StrictMode>
      {Wrapper ? (
        <Wrapper>
          {appElement}
        </Wrapper>
      ) : (
        appElement
      )}
    </React.StrictMode>,
  )
}

renderApp()
