import React, { useState } from 'react'
import { Image, Skeleton } from 'antd'
import { useLazyLoad } from '../../hooks/useLazyLoad'

interface LazyImageProps {
  src: string
  alt?: string
  placeholder?: React.ReactNode
  fallback?: string
  width?: number | string
  height?: number | string
  style?: React.CSSProperties
  className?: string
  rootMargin?: string
  threshold?: number
  triggerOnce?: boolean
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  fallback,
  width,
  height,
  style,
  className,
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true,
}) => {
  const [imageError, setImageError] = useState(false)
  const { elementRef, shouldLoad } = useLazyLoad({
    rootMargin,
    threshold,
    triggerOnce,
  })

  const handleError = () => {
    setImageError(true)
  }

  const defaultPlaceholder = (
    <Skeleton.Image
      style={{
        width: width || '100%',
        height: height || 200,
      }}
    />
  )

  if (!shouldLoad) {
    return (
      <div
        ref={elementRef as React.RefObject<HTMLDivElement>}
        style={{
          width,
          height,
          ...style,
        }}
        className={className}
      >
        {placeholder || defaultPlaceholder}
      </div>
    )
  }

  return (
    <Image
      src={imageError ? fallback : src}
      alt={alt}
      width={width}
      height={height}
      style={style}
      className={className}
      placeholder={placeholder || defaultPlaceholder}
      onError={handleError}
      loading="lazy"
    />
  )
}

export default LazyImage
