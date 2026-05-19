// 响应式断点配置
export const breakpoints = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
}

// 媒体查询工具函数
export const mediaQueries = {
  xs: `@media (max-width: ${breakpoints.xs - 1}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`,
  md: `@media (min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px) and (max-width: ${breakpoints.xxl - 1}px)`,
  xxl: `@media (min-width: ${breakpoints.xxl}px)`,
  mobile: `@media (max-width: ${breakpoints.md - 1}px)`,
  tablet: `@media (min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `@media (min-width: ${breakpoints.lg}px)`,
}

// 响应式工具类
export const responsiveUtils = {
  // 隐藏/显示工具
  hideOnMobile: {
    [mediaQueries.mobile]: {
      display: 'none !important',
    },
  },
  showOnMobile: {
    [mediaQueries.desktop]: {
      display: 'none !important',
    },
  },
  hideOnTablet: {
    [mediaQueries.tablet]: {
      display: 'none !important',
    },
  },
  showOnTablet: {
    [mediaQueries.mobile]: {
      display: 'none !important',
    },
    [mediaQueries.desktop]: {
      display: 'none !important',
    },
  },
  hideOnDesktop: {
    [mediaQueries.desktop]: {
      display: 'none !important',
    },
  },
  showOnDesktop: {
    [mediaQueries.mobile]: {
      display: 'none !important',
    },
  },
}
