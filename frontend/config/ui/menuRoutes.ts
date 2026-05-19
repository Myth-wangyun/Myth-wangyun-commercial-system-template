/**
 * 菜单到路由的映射
 * 将菜单项的 key 映射到实际路由路径
 */
import { ALL_MENU_ITEMS, type MenuItemConfig, findMenuItemByKey } from './menuItems'
import { getRouteByKey, getFullPath, getRouteByMenuKey } from '../router/routes'

/**
 * 根据菜单 key 获取路由路径
 */
export const getRoutePathByMenuKey = (menuKey: string): string => {
  const menuItem = findMenuItemByKey(menuKey)

  if (!menuItem) {
    return ''
  }

  // 如果有 routeKey，从路由配置获取路径
  if (menuItem.routeKey) {
    const route = getRouteByKey(menuItem.routeKey)
    if (route) {
      return getFullPath(route)
    }
  }

  // 如果有 menuKey（core-data 类型），生成带 menu 参数的路径
  if (menuItem.menuKey) {
    const route = getRouteByMenuKey(menuItem.menuKey)
    if (route) {
      return getFullPath(route)
    }
    // 如果找不到路由配置，使用默认的 core-data 路径
    return `/academic/teaching-content?menu=${menuItem.menuKey}`
  }

  return ''
}

/**
 * 生成完整的路由映射表（用于 Sidebar 的 routeMap）
 */
export const generateRouteMap = (): Record<string, string> => {
  const routeMap: Record<string, string> = {}

  const traverseMenuItems = (items: MenuItemConfig[]) => {
    items.forEach((item) => {
      routeMap[item.key] = getRoutePathByMenuKey(item.key)
      if (item.children) {
        traverseMenuItems(item.children)
      }
    })
  }

  traverseMenuItems(ALL_MENU_ITEMS)
  return routeMap
}
