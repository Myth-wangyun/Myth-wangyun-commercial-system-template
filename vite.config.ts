import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'
import path from 'path'

const getNodeModulePackageName = (id: string) => {
  const match = id.match(/\/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(@[^/]+\/[^/]+|[^/]+)/)
  return match?.[1] || null
}

const getSpreadsheetChunkName = (packageName: string) => {
  if (packageName === 'xlsx') {
    return 'xlsx-vendor'
  }

  if (packageName === 'exceljs') {
    return 'exceljs-core'
  }

  if (packageName === 'jszip' || packageName === 'pako') {
    return 'exceljs-zip'
  }

  if (packageName === 'saxes' || packageName === 'xmlchars') {
    return 'exceljs-xml'
  }

  if (
    packageName === 'buffer' ||
    packageName === 'readable-stream' ||
    packageName === 'inherits' ||
    packageName === 'process-nextick-args' ||
    packageName === 'safe-buffer' ||
    packageName === 'string_decoder' ||
    packageName === 'util-deprecate'
  ) {
    return 'exceljs-stream'
  }

  return null
}

const getManualChunkName = (id: string) => {
  const normalizedId = id.replace(/\\/g, '/')
  const packageName = getNodeModulePackageName(normalizedId)

  if (!normalizedId.includes('/node_modules/')) {
    if (normalizedId.endsWith('/frontend/config/router/routesGenerator.tsx')) {
      return 'router-generator'
    }

    if (normalizedId.endsWith('/frontend/config/router/mobileRouteEntries.tsx')) {
      return 'mobile-route-entries'
    }

    if (normalizedId.endsWith('/frontend/config/router/campusRouteEntries.tsx')) {
      return 'campus-route-entries'
    }

    if (normalizedId.endsWith('/frontend/config/router/routeComponents.ts')) {
      return 'route-components'
    }

    if (normalizedId.endsWith('/frontend/config/router/routes.ts')) {
      return 'route-definitions'
    }

    return undefined
  }

  if (
    normalizedId.includes('/react/') ||
    normalizedId.includes('/react-dom/') ||
    normalizedId.includes('/react-router/') ||
    normalizedId.includes('/react-router-dom/') ||
    normalizedId.includes('/scheduler/')
  ) {
    return 'react-vendor'
  }

  // dayjs 必须独立 chunk —— antd 和 main.tsx 都依赖它，
  // 若被 Rollup 内联到 antd-vendor，会把 antd-vendor 拉入首屏 modulepreload
  if (packageName === 'dayjs') {
    return 'dayjs-vendor'
  }

  // @ant-design/icons 及其直接依赖（colors, fast-color, icons-svg）独立 chunk
  // 这些包没有 module-init 时对 antd 核心的依赖，可以安全拆分
  if (
    normalizedId.includes('/@ant-design/icons') ||
    normalizedId.includes('/@ant-design/icons-svg') ||
    normalizedId.includes('/@ant-design/colors') ||
    normalizedId.includes('/@ant-design/fast-color')
  ) {
    return 'antd-icons'
  }

  // rc-picker 是最大的 rc 组件（711 KB source），单独拆分
  if (packageName === 'rc-picker') {
    return 'antd-picker'
  }

  // 数据展示类组件（rc-table / rc-tree / rc-select 等）拆分
  if (
    packageName === 'rc-table' ||
    packageName === 'rc-tree' ||
    packageName === 'rc-tree-select' ||
    packageName === 'rc-select' ||
    packageName === 'rc-cascader' ||
    packageName === 'rc-virtual-list'
  ) {
    return 'antd-data-display'
  }

  // 其余 rc-* / @rc-component/* 共享组件统一归类
  if (normalizedId.includes('/rc-') || normalizedId.includes('/@rc-component/')) {
    return 'antd-rc-shared'
  }

  // CSS-in-JS 运行时（@ant-design/cssinjs + @emotion/* + stylis）独立拆分
  if (
    normalizedId.includes('/@ant-design/cssinjs') ||
    normalizedId.includes('/@emotion/') ||
    packageName === 'stylis'
  ) {
    return 'antd-cssinjs'
  }

  // antd 组件样式生成器 + theme 系统独立拆分
  // 每个组件的 style/ 目录包含 CSS-in-JS 样式代码，只在渲染时通过 useStyle hook 调用
  if (
    packageName === 'antd' && (
      /\/antd\/es\/[^/]+\/style\//.test(normalizedId) ||
      /\/antd\/es\/theme\//.test(normalizedId) ||
      /\/antd\/es\/style\//.test(normalizedId)
    )
  ) {
    return 'antd-styles'
  }

  // antd 核心组件 + 剩余 @ant-design/*
  if (packageName === 'antd' || normalizedId.includes('/@ant-design/')) {
    return 'antd-vendor'
  }

  const spreadsheetChunkName = packageName ? getSpreadsheetChunkName(packageName) : null
  if (spreadsheetChunkName) {
    return spreadsheetChunkName
  }

  if (normalizedId.includes('/html2canvas/')) {
    return 'html2canvas-vendor'
  }

  if (
    normalizedId.includes('/recharts/') ||
    normalizedId.includes('/victory-vendor/') ||
    /\/node_modules\/d3-[^/]+\//.test(normalizedId)
  ) {
    return 'charts-vendor'
  }

  return undefined
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  console.log('Building with mode:', mode)
  console.log('VITE_ENABLE_CAPTCHA:', env.VITE_ENABLE_CAPTCHA)

  const enableCaptcha = env.VITE_ENABLE_CAPTCHA === 'true'
  const enableReactScan = env.VITE_ENABLE_REACT_SCAN === 'true'
  const enableStats = env.VITE_ENABLE_STATS === 'true'

  console.log('enableCaptcha (boolean):', enableCaptcha)

  return {
    plugins: [
      react(),
      // 构建时生成 .gz 预压缩文件（nginx gzip_static 可直接使用）
      compression({ algorithm: 'gzip', exclude: [/\.(png|jpg|jpeg|gif|ico|woff2?)$/i] }),
      // 构建时生成 .br 预压缩文件（nginx brotli_static 可直接使用）
      compression({ algorithm: 'brotliCompress', exclude: [/\.(png|jpg|jpeg|gif|ico|woff2?)$/i] }),
    ],
    define: {
      __ENABLE_CAPTCHA__: enableCaptcha,
      __ENABLE_REACT_SCAN__: enableReactScan,
      __ENABLE_STATS__: enableStats,
    },
    root: './',
    resolve: {
      alias: [
        {
          find: '@/pages/A-teaching-quality/A-campus',
          replacement: path.resolve(__dirname, './frontend/pages/teaching-quality/campus'),
        },
        {
          find: '@/pages/A-teaching-quality',
          replacement: path.resolve(__dirname, './frontend/pages/teaching-quality'),
        },
        {
          find: '@',
          replacement: path.resolve(__dirname, './frontend'),
        },
      ],
    },
    optimizeDeps: {
      include: ['@ant-design/fast-color'],
      exclude: [],
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        onwarn(warning) {
          const source = warning.id || warning.loc?.file || ''
          const sources = Array.isArray(warning.ids) ? warning.ids : source ? [source] : []
          const normalizedSources = sources.map((entry) => entry.replace(/\\/g, '/'))
          const isNodeModulesOnly =
            normalizedSources.length > 0 &&
            normalizedSources.every((entry) => entry.includes('/node_modules/'))

          if (
            warning.code === 'THIS_IS_UNDEFINED' &&
            source.replace(/\\/g, '/').includes('/node_modules/')
          ) {
            return
          }

          if (
            warning.code === 'CIRCULAR_DEPENDENCY' &&
            isNodeModulesOnly
          ) {
            return
          }

          if (warning.code === 'CIRCULAR_CHUNK') {
            return
          }

          if (warning.code === 'FILE_NAME_CONFLICT') {
            return
          }

          const code = warning.code || 'UNKNOWN'
          throw new Error(`[rollup warning:${code}] ${warning.message}`)
        },
        output: {
          manualChunks(id) {
            return getManualChunkName(id)
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '5000'),
      proxy: {
        '/api/v1': {
          target:
            process.env.VITE_PROXY_TARGET ||
            process.env.VITE_API_BASE_URL?.replace('/api/v1', '') ||
            'http://localhost:8000',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, req, res) => {
              console.error('Proxy error:', err.message)
              console.error('Request URL:', req.url)
              if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
                console.error('Hint: backend service may not be running')
                console.error('Run: cd backend && python main.py --mode dev')
              }
              if (!res.headersSent) {
                res.writeHead(502, {
                  'Content-Type': 'application/json',
                })
                res.end(
                  JSON.stringify({
                    success: false,
                    message: 'Backend service unavailable',
                    error: 'Backend service unavailable',
                  }),
                )
              }
            })
            proxy.on('proxyReq', (_proxyReq, req, _res) => {
              const target =
                process.env.VITE_PROXY_TARGET ||
                process.env.VITE_API_BASE_URL?.replace('/api/v1', '') ||
                'http://localhost:8000'
              console.log(`Proxy request: ${req.method} ${req.url} -> ${target}${req.url}`)
            })
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log(`Proxy response: ${proxyRes.statusCode} ${req.url}`)
            })
          },
        },
      },
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/venv/**',
          '**/*.py',
          '**/*.pyc',
          '**/__pycache__/**',
          '**/mypy/**',
          '**/typeshed/**',
        ],
      },
    },
    base: '/',
  }
})
