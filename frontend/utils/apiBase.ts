/**
 * 统一的后端 API 基础地址获取方法
 *
 * 优先使用 VITE_API_BASE_URL（建议包含 /api/v1），否则用 VITE_API_BASE，再不行根据环境自动选择。
 * Windows 开发模式默认直接请求 localhost:8000，不使用代理。
 * 使用 buildApiUrl 拼接时会自动去重斜杠，避免出现 /api/v1/api/v1 的重复前缀。
 */

import { useAuthStore } from '@/stores/authStore';
import { useCampusStore } from '@/stores/campusStore';

const getDefaultApiBase = () => {
  // 1. 优先使用环境变量（生产构建时会被替换）
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE
  }
  
  // 2. 开发模式下的自动检测（仅在未设置环境变量时生效）
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    const hostname = window.location.hostname
    const port = window.location.port
    
    // 本地开发：localhost 或 127.0.0.1
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api/v1'
    }
    // 开发服务器端口 5173/5174 -> 后端 8000
    if (port === '5173' || port === '5174') {
      return `http://${hostname}:8000/api/v1`
    }
  }
  
  // 3. 生产环境：使用相对路径，由 nginx 反代到后端
  return '/api/v1'
}

const rawBase = getDefaultApiBase();

const trimTrailing = (s: string) => s.replace(/\/+$/, '');
const trimLeading = (s: string) => s.replace(/^\/+/, '');

export const API_BASE = trimTrailing(rawBase);

export const buildApiUrl = (path: string) => {
  return `${API_BASE}/${trimLeading(path)}`;
};

/**
 * 通用 fetch 包装函数
 * 从 zustand store 内存中动态获取 token（不依赖 localStorage）
 */
export const apiFetch = (url: string, options: RequestInit = {}): Promise<Response> => {
  // 直接从 zustand store 内存获取认证信息（安全：不暴露到 localStorage）
  const token = useAuthStore.getState().token;
  const campus = useCampusStore.getState().currentCampus;
  
  // 构建请求头
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  
  // 添加动态认证 token（从内存获取）
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // 添加神殿信息
  if (campus) {
    headers['X-Campus'] = btoa(encodeURIComponent(campus));
  }
  
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
};
