import React, { useEffect, useRef, useCallback, useState, useImperativeHandle, forwardRef } from 'react'

export interface CaptchaRef {
  /** 刷新验证码 */
  refresh: () => void
  /** 验证输入的验证码是否正确（不区分大小写） */
  validate: (input: string) => boolean
  /** 获取当前验证码（调试用） */
  getCode: () => string
}

interface CaptchaProps {
  /** Canvas 宽度 */
  width?: number
  /** Canvas 高度 */
  height?: number
  /** 验证码长度 */
  length?: number
  /** 验证码字符集 */
  charset?: string
  /** 点击刷新回调 */
  onRefresh?: () => void
}

/**
 * 纯前端验证码组件
 * 使用 Canvas 绘制随机验证码，支持刷新和验证
 */
const Captcha = forwardRef<CaptchaRef, CaptchaProps>((props, ref) => {
  const {
    width = 120,
    height = 40,
    length = 4,
    // 排除容易混淆的字符：0/O, 1/l/I
    charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789',
    onRefresh,
  } = props

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [code, setCode] = useState('')

  // 生成随机颜色
  const randomColor = useCallback((min: number, max: number) => {
    const r = Math.floor(Math.random() * (max - min) + min)
    const g = Math.floor(Math.random() * (max - min) + min)
    const b = Math.floor(Math.random() * (max - min) + min)
    return `rgb(${r},${g},${b})`
  }, [])

  // 生成随机验证码字符串
  const generateCode = useCallback(() => {
    let result = ''
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)]
    }
    return result
  }, [length, charset])

  // 绘制验证码
  const drawCaptcha = useCallback((captchaCode: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    // 绘制背景
    ctx.fillStyle = randomColor(200, 255)
    ctx.fillRect(0, 0, width, height)

    // 绘制干扰线
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = randomColor(100, 200)
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(Math.random() * width, Math.random() * height)
      ctx.lineTo(Math.random() * width, Math.random() * height)
      ctx.stroke()
    }

    // 绘制干扰点
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = randomColor(100, 200)
      ctx.beginPath()
      ctx.arc(Math.random() * width, Math.random() * height, 1, 0, 2 * Math.PI)
      ctx.fill()
    }

    // 绘制验证码字符
    const fontSize = Math.min(height * 0.7, 28)
    ctx.font = `bold ${fontSize}px Arial, sans-serif`
    ctx.textBaseline = 'middle'

    const charWidth = width / (length + 1)
    for (let i = 0; i < captchaCode.length; i++) {
      ctx.save()
      
      // 字符颜色
      ctx.fillStyle = randomColor(30, 100)
      
      // 字符位置
      const x = charWidth * (i + 0.5)
      const y = height / 2
      
      // 随机旋转角度 (-15° ~ 15°)
      const angle = (Math.random() - 0.5) * 30 * Math.PI / 180
      
      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.fillText(captchaCode[i], 0, 0)
      
      ctx.restore()
    }
  }, [width, height, length, randomColor])

  // 刷新验证码
  const refresh = useCallback(() => {
    const newCode = generateCode()
    setCode(newCode)
    drawCaptcha(newCode)
    onRefresh?.()
  }, [generateCode, drawCaptcha, onRefresh])

  // 验证输入（不区分大小写）
  const validate = useCallback((input: string) => {
    return input.toLowerCase() === code.toLowerCase()
  }, [code])

  // 获取当前验证码
  const getCode = useCallback(() => code, [code])

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    refresh,
    validate,
    getCode,
  }), [refresh, validate, getCode])

  // 初始化
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={refresh}
      style={{
        cursor: 'pointer',
        borderRadius: 4,
        border: '1px solid #d9d9d9',
      }}
      title="点击刷新验证码"
    />
  )
})

Captcha.displayName = 'Captcha'

export default Captcha
