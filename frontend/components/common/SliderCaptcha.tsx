import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { CheckCircleFilled, ReloadOutlined } from '@ant-design/icons'

export interface SliderCaptchaRef {
  /** 重置滑块验证 */
  reset: () => void
  /** 获取验证状态 */
  isVerified: () => boolean
}

interface SliderCaptchaProps {
  /** 组件宽度 */
  width?: number
  /** 滑块宽度 */
  sliderWidth?: number
  /** 验证成功回调 */
  onSuccess?: () => void
  /** 验证失败回调 */
  onFail?: () => void
  /** 允许的误差范围（像素） */
  tolerance?: number
}

/**
 * 滑块验证码组件
 * 用于生产环境防止爬虫和自动化攻击
 */
const SliderCaptcha = forwardRef<SliderCaptchaRef, SliderCaptchaProps>((props, ref) => {
  const {
    width = 320,
    sliderWidth = 50,
    onSuccess,
    onFail,
    tolerance = 5,
  } = props

  const [isDragging, setIsDragging] = useState(false)
  const [sliderLeft, setSliderLeft] = useState(0)
  const [targetPosition, setTargetPosition] = useState(0)
  const [isVerified, setIsVerified] = useState(false)
  const [isFailed, setIsFailed] = useState(false)
  const [startX, setStartX] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const maxSlide = width - sliderWidth - 4 // 4px for border

  // 生成随机目标位置（在轨道的40%-80%范围内）
  const generateTargetPosition = useCallback(() => {
    const minPos = maxSlide * 0.4
    const maxPos = maxSlide * 0.8
    return Math.floor(Math.random() * (maxPos - minPos) + minPos)
  }, [maxSlide])

  // 初始化
  useEffect(() => {
    setTargetPosition(generateTargetPosition())
  }, [generateTargetPosition])

  // 重置验证
  const reset = useCallback(() => {
    setSliderLeft(0)
    setIsVerified(false)
    setIsFailed(false)
    setTargetPosition(generateTargetPosition())
  }, [generateTargetPosition])

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    reset,
    isVerified: () => isVerified,
  }))

  // 开始拖动
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isVerified) return
    setIsDragging(true)
    setIsFailed(false)
    setStartX(e.clientX - sliderLeft)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isVerified) return
    setIsDragging(true)
    setIsFailed(false)
    setStartX(e.touches[0].clientX - sliderLeft)
  }

  // 拖动中
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || isVerified) return
    const newLeft = Math.min(Math.max(0, e.clientX - startX), maxSlide)
    setSliderLeft(newLeft)
  }, [isDragging, isVerified, startX, maxSlide])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || isVerified) return
    const newLeft = Math.min(Math.max(0, e.touches[0].clientX - startX), maxSlide)
    setSliderLeft(newLeft)
  }, [isDragging, isVerified, startX, maxSlide])

  // 结束拖动
  const handleMouseUp = useCallback(() => {
    if (!isDragging || isVerified) return
    setIsDragging(false)

    // 验证是否到达目标位置
    if (Math.abs(sliderLeft - targetPosition) <= tolerance) {
      setIsVerified(true)
      onSuccess?.()
    } else {
      setIsFailed(true)
      onFail?.()
      // 失败后短暂显示红色，然后重置
      setTimeout(() => {
        setSliderLeft(0)
        setIsFailed(false)
      }, 500)
    }
  }, [isDragging, isVerified, sliderLeft, targetPosition, tolerance, onSuccess, onFail])

  // 添加全局事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove])

  // 计算滑块填充宽度
  const fillWidth = sliderLeft + sliderWidth / 2

  return (
    <div style={{ width, userSelect: 'none' }}>
      {/* 滑块轨道 */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: 44,
          backgroundColor: isVerified ? '#d4edda' : isFailed ? '#f8d7da' : '#e9ecef',
          borderRadius: 22,
          border: `2px solid ${isVerified ? '#28a745' : isFailed ? '#dc3545' : '#dee2e6'}`,
          overflow: 'hidden',
          transition: 'background-color 0.3s, border-color 0.3s',
        }}
      >
        {/* 目标位置指示器 */}
        {!isVerified && (
          <div
            style={{
              position: 'absolute',
              left: targetPosition + sliderWidth / 2 - 2,
              top: 0,
              width: 4,
              height: '100%',
              backgroundColor: 'rgba(24, 144, 255, 0.3)',
              borderRadius: 2,
            }}
          />
        )}

        {/* 已滑动填充区域 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: fillWidth,
            height: '100%',
            backgroundColor: isVerified ? '#28a745' : isFailed ? '#dc3545' : '#1890ff',
            borderRadius: '20px 0 0 20px',
            transition: isDragging ? 'none' : 'width 0.3s',
            opacity: 0.3,
          }}
        />

        {/* 提示文字 */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isVerified ? '#28a745' : isFailed ? '#dc3545' : '#6c757d',
            fontSize: 14,
            fontWeight: 500,
            pointerEvents: 'none',
          }}
        >
          {isVerified ? (
            <>
              <CheckCircleFilled style={{ marginRight: 6, color: '#28a745' }} />
              验证成功
            </>
          ) : isFailed ? (
            '验证失败，请重试'
          ) : (
            '向右拖动滑块到蓝色位置'
          )}
        </div>

        {/* 滑块 */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{
            position: 'absolute',
            left: sliderLeft,
            top: 0,
            width: sliderWidth,
            height: '100%',
            backgroundColor: isVerified 
              ? 'rgba(40, 167, 69, 0.2)' 
              : isFailed 
                ? 'rgba(220, 53, 69, 0.2)' 
                : 'rgba(255, 255, 255, 0.2)',
            borderRadius: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            cursor: isVerified ? 'default' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: isDragging ? 'none' : 'left 0.3s, background-color 0.3s',
            backdropFilter: 'blur(4px)',
          }}
        >
          {isVerified ? (
            <CheckCircleFilled style={{ fontSize: 20, color: '#fff' }} />
          ) : (
            <div style={{ 
              display: 'flex', 
              gap: 2,
              color: isFailed ? '#fff' : '#1890ff',
            }}>
              <div style={{ width: 3, height: 14, backgroundColor: 'currentColor', borderRadius: 1 }} />
              <div style={{ width: 3, height: 14, backgroundColor: 'currentColor', borderRadius: 1 }} />
            </div>
          )}
        </div>
      </div>

      {/* 重置按钮 */}
      {!isVerified && (
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <span
            onClick={reset}
            style={{
              color: '#1890ff',
              cursor: 'pointer',
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <ReloadOutlined /> 刷新
          </span>
        </div>
      )}
    </div>
  )
})

SliderCaptcha.displayName = 'SliderCaptcha'

export default SliderCaptcha
