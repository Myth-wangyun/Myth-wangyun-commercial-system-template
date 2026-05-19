/**
 * 禁止复制的容器组件
 * 包装任何内容以禁止复制粘贴操作
 */

import React, { useCallback, useEffect, useRef } from 'react'
import { App } from 'antd'

interface NoCopyContainerProps {
  children: React.ReactNode
  /** 是否启用禁止复制，默认 true */
  enabled?: boolean
  /** 复制时的提示消息 */
  warningMessage?: string
  /** 自定义样式 */
  style?: React.CSSProperties
  /** 自定义类名 */
  className?: string
}

type LegacyUserSelectStyle = React.CSSProperties & {
  msUserSelect?: React.CSSProperties['msUserSelect']
}

/**
 * 禁止复制的容器组件
 * 
 * 使用方式：
 * ```tsx
 * <NoCopyContainer>
 *   <Table ... />
 * </NoCopyContainer>
 * ```
 */
const NoCopyContainer: React.FC<NoCopyContainerProps> = ({
  children,
  enabled = true,
  warningMessage = '此内容禁止复制',
  style,
  className,
}) => {
  const { message } = App.useApp()
  const containerRef = useRef<HTMLDivElement>(null)

  // 阻止复制事件
  const handleCopy = useCallback((e: ClipboardEvent) => {
    if (!enabled) return
    e.preventDefault()
    message.warning(warningMessage)
  }, [enabled, warningMessage])

  // 阻止剪切事件
  const handleCut = useCallback((e: ClipboardEvent) => {
    if (!enabled) return
    e.preventDefault()
    message.warning(warningMessage)
  }, [enabled, warningMessage])

  // 阻止右键菜单
  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (!enabled) return
    e.preventDefault()
  }, [enabled])

  // 阻止键盘快捷键复制
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return
    // 阻止 Ctrl+C, Ctrl+X, Ctrl+A
    if (e.ctrlKey || e.metaKey) {
      if (['c', 'x'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        message.warning(warningMessage)
      }
      // 阻止全选但不提示
      if (e.key.toLowerCase() === 'a') {
        e.preventDefault()
      }
    }
  }, [enabled, warningMessage])

  // 阻止拖拽选择
  const handleDragStart = useCallback((e: DragEvent) => {
    if (!enabled) return
    e.preventDefault()
  }, [enabled])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 绑定事件
    container.addEventListener('copy', handleCopy)
    container.addEventListener('cut', handleCut)
    container.addEventListener('contextmenu', handleContextMenu)
    container.addEventListener('keydown', handleKeyDown)
    container.addEventListener('dragstart', handleDragStart)

    return () => {
      container.removeEventListener('copy', handleCopy)
      container.removeEventListener('cut', handleCut)
      container.removeEventListener('contextmenu', handleContextMenu)
      container.removeEventListener('keydown', handleKeyDown)
      container.removeEventListener('dragstart', handleDragStart)
    }
  }, [handleCopy, handleCut, handleContextMenu, handleKeyDown, handleDragStart])

  const containerStyle: LegacyUserSelectStyle = {
    ...style,
    ...(enabled ? {
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
    } : {}),
  }

  return (
    <div 
      ref={containerRef} 
      className={`no-copy-container ${className || ''}`}
      style={containerStyle}
    >
      {children}
    </div>
  )
}

export default NoCopyContainer
