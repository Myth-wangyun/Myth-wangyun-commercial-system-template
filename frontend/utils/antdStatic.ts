/**
 * antd 5 静态方法全局持有器
 *
 * antd 5 的 message / notification / modal 静态调用（如 `message.success()`）
 * 不会继承 ConfigProvider 的主题和国际化上下文。
 * 正确做法是通过 `App.useApp()` 获取实例。
 *
 * 本模块在 App.tsx 中通过 <AntdStaticHolder /> 组件捕获 context-aware 实例，
 * 然后导出供非组件代码（utils、services）使用。
 *
 * 用法：
 *   组件内：const { message } = App.useApp()
 *   非组件：import { appMessage } from '@/utils/antdStatic'; appMessage().success('ok')
 */
import {
  message as staticMessage,
  notification as staticNotification,
  Modal as StaticModal,
} from 'antd'
import type { MessageInstance } from 'antd/es/message/interface'
import type { NotificationInstance } from 'antd/es/notification/interface'

let _message: MessageInstance | null = null
let _notification: NotificationInstance | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _modal: any = null

/** 由 <AntdStaticHolder /> 调用，注入 context-aware 实例 */
export function setAntdInstances(msg: MessageInstance, ntf: NotificationInstance, mdl: unknown) {
  _message = msg
  _notification = ntf
  _modal = mdl
}

/**
 * 获取 context-aware 的 message 实例。
 * 如果 App 尚未挂载，回退到 antd 静态 message。
 */
export function appMessage(): MessageInstance {
  return _message ?? staticMessage
}

/** 获取 context-aware 的 notification 实例 */
export function appNotification(): NotificationInstance {
  return _notification ?? staticNotification
}

/** 获取 context-aware 的 modal 实例 */
export function appModal() {
  return _modal ?? StaticModal
}
