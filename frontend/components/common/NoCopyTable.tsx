/**
 * 禁止复制粘贴的表格组件
 * 用于祈福司门等敏感数据页面
 */

import React, { useCallback, useEffect, useRef } from 'react'
import { Table, App } from 'antd'
import type { TableProps } from 'antd'

interface NoCopyTableProps<T> extends TableProps<T> {
  /** 是否禁用复制，默认 true */
  disableCopy?: boolean
  /** 是否禁用右键菜单，默认 true */
  disableContextMenu?: boolean
  /** 是否禁用选择文本，默认 true */
  disableSelection?: boolean
  /** 复制时的提示消息 */
  copyWarningMessage?: string
}

/**
 * 禁止复制粘贴的表格组件
 * 
 * 功能：
 * 1. 禁止复制表格内容（Ctrl+C, Ctrl+X）
 * 2. 禁止右键菜单
 * 3. 禁止选择文本
 * 4. 禁止拖拽选择
 */
function NoCopyTable<T extends object>({
  disableCopy = true,
  disableContextMenu = true,
  disableSelection = true,
  copyWarningMessage = '此表格内容禁止复制',
  className,
  style,
  ...tableProps
}: NoCopyTableProps<T>) {
  const { message } = App.useApp()
  const containerRef = useRef<HTMLDivElement>(null)

  // 阻止复制事件
  const handleCopy = useCallback((e: ClipboardEvent) => {
    if (!disableCopy) return
    e.preventDefault()
    message.warning(copyWarningMessage)
  }, [disableCopy, copyWarningMessage])

  // 阻止剪切事件
  const handleCut = useCallback((e: ClipboardEvent) => {
    if (!disableCopy) return
    e.preventDefault()
    message.warning(copyWarningMessage)
  }, [disableCopy, copyWarningMessage])

  // 阻止右键菜单
  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (!disableContextMenu) return
    e.preventDefault()
  }, [disableContextMenu])

  // 阻止键盘快捷键复制
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!disableCopy) return
    // 阻止 Ctrl+C, Ctrl+X, Ctrl+A
    if (e.ctrlKey || e.metaKey) {
      if (['c', 'x', 'a'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        if (e.key.toLowerCase() !== 'a') {
          message.warning(copyWarningMessage)
        }
      }
    }
  }, [disableCopy, copyWarningMessage])

  // 阻止拖拽选择
  const handleDragStart = useCallback((e: DragEvent) => {
    if (!disableCopy) return
    e.preventDefault()
  }, [disableCopy])

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

  const containerStyle: React.CSSProperties = {
    ...style,
    ...(disableSelection ? {
      userSelect: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
    } : {}),
  }

  return (
    <div 
      ref={containerRef} 
      className={`no-copy-table ${className || ''}`}
      style={containerStyle}
    >
      <Table<T> {...tableProps} />
    </div>
  )
}

export default NoCopyTable
