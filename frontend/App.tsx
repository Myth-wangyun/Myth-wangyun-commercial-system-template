import { ConfigProvider, App as AntApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import AppRouter from './router'
import ErrorBoundary from './components/ErrorBoundary'
import { setAntdInstances } from './utils/antdStatic'

/** 捕获 App.useApp() 的 context-aware 实例，供非组件代码使用 */
function AntdStaticHolder() {
  const { message, notification, modal } = AntApp.useApp()
  setAntdInstances(message, notification, modal)
  return null
}

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AntApp>
        <AntdStaticHolder />
        <ErrorBoundary>
          <div className="App">
            <AppRouter />
          </div>
        </ErrorBoundary>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
