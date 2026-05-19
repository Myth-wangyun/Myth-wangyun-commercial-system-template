import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { registerApiRuntime } from '@/services/apiRuntime'
import { fetchCampuses } from '@/services/configMaster'
import type { CampusProfile } from '@/services/configMaster'
import { sortCampuses } from '@/utils/campusSort'

export interface Campus {
  id: string
  name: string
  code?: string
  website: string
  mobileWebsite: string
  status?: 'active' | 'inactive' | 'maintenance'
  color: string
}

export interface CampusState {
  // 状态
  currentCampus: string | null
  campuses: Campus[]

  // 操作
  setCampus: (campus: string) => void
  getCurrentCampus: () => Campus | null
  getCampusByName: (name: string) => Campus | null
  getAllCampuses: () => Campus[]
  getFilteredCampuses: (accessibleCampuses?: string[]) => Campus[]  // 新增：根据权限过滤神殿
  addCampus: (campus: Omit<Campus, 'id'> & { id?: string }) => void
  updateCampus: (id: string, campus: Partial<Campus>) => void
  removeCampus: (id: string) => void
  loadCampusesFromConfig: () => Promise<void>
}

// 神殿数据
const CAMPUSES: Campus[] = [
  {
    id: '1',
    name: '主神殿',
    website: '',
    mobileWebsite: '',
    status: 'active',
    color: '#1890ff',
  },
  {
    id: '2',
    name: '永恒殿',
    website: '',
    mobileWebsite: '',
    status: 'active',
    color: '#52c41a',
  },
  {
    id: '3',
    name: '慈悲殿',
    website: '#',
    mobileWebsite: '#',
    status: 'active',
    color: '#f5222d',
  },
  {
    id: '4',
    name: '李大殿',
    website: '',
    mobileWebsite: '',
    status: 'active',
    color: '#faad14',
  },
  {
    id: '5',
    name: '智慧阁',
    website: '',
    mobileWebsite: '',
    status: 'active',
    color: '#722ed1',
  },
  {
    id: '6',
    name: '光明殿',
    website: '#',
    mobileWebsite: '#',
    status: 'active',
    color: '#000000',
  },
  {
    id: '7',
    name: '神恩殿',
    website: '',
    mobileWebsite: '',
    status: 'active',
    color: '#1890ff',
  },
  {
    id: '8',
    name: '天威殿',
    website: '#',
    mobileWebsite: '#',
    status: 'active',
    color: '#eb2f96',
  },
]

const MANAGEMENT_CENTER_CANONICAL_NAME = '最高议事厅神殿'
const MANAGEMENT_CENTER_ALIASES = ['最高议事厅', '最高议事厅神殿', '总部', '总部神殿']

const EXPLICIT_CAMPUS_ALIAS_MAP: Record<string, string> = {
  最高议事厅: MANAGEMENT_CENTER_CANONICAL_NAME,
  最高议事厅神殿: MANAGEMENT_CENTER_CANONICAL_NAME,
  总部: MANAGEMENT_CENTER_CANONICAL_NAME,
  总部神殿: MANAGEMENT_CENTER_CANONICAL_NAME,
}

const getCampusDisplayScore = (name: string) => {
  let score = name.length
  if (name.includes('神殿')) score += 100
  if (name === '最高议事厅神殿') score += 200
  if (/^(河北|山西|广西|贵州)/.test(name)) score += 50
  return score
}

const pickPreferredCampusName = (candidates: string[]) => {
  const uniqueCandidates = Array.from(new Set(candidates.map((item) => item.trim()).filter(Boolean)))
  return uniqueCandidates.sort((a, b) => {
    const scoreDiff = getCampusDisplayScore(b) - getCampusDisplayScore(a)
    if (scoreDiff !== 0) return scoreDiff
    const lengthDiff = b.length - a.length
    if (lengthDiff !== 0) return lengthDiff
    return a.localeCompare(b, 'zh-CN')
  })[0]
}

const buildCampusAliasMap = (profiles: Array<Pick<CampusProfile, 'name' | 'short_name'>>) => {
  const groups = new Map<string, Set<string>>()
  const allNames = profiles.map((item) => item.name?.trim()).filter((item): item is string => !!item)

  const addToGroup = (groupKey: string, value?: string | null) => {
    const normalizedValue = value?.trim()
    if (!normalizedValue) return
    if (!groups.has(groupKey)) {
      groups.set(groupKey, new Set<string>())
    }
    groups.get(groupKey)?.add(normalizedValue)
  }

  MANAGEMENT_CENTER_ALIASES.forEach((alias) => addToGroup('management-center', alias))
  allNames.filter((name) => MANAGEMENT_CENTER_ALIASES.some((alias) => name.includes(alias))).forEach((name) => {
    addToGroup('management-center', name)
  })

  profiles.forEach((profile) => {
    const shortName = profile.short_name?.trim()
    if (!shortName) return
    const groupKey = `short:${shortName}`
    addToGroup(groupKey, shortName)
    addToGroup(groupKey, `${shortName}神殿`)
    allNames.filter((name) => name.includes(shortName)).forEach((name) => addToGroup(groupKey, name))
  })

  const aliasMap: Record<string, string> = { ...EXPLICIT_CAMPUS_ALIAS_MAP }
  allNames.forEach((name) => {
    aliasMap[name] = name
  })

  groups.forEach((values) => {
    const preferredName = pickPreferredCampusName(Array.from(values))
    values.forEach((value) => {
      aliasMap[value] = preferredName
    })
  })

  return aliasMap
}

export const normalizeCampusSelectionName = (
  value: string | null | undefined,
  campusNames: string[] = [],
  aliasMap?: Record<string, string>,
) => {
  const normalizedValue = value?.trim() || ''
  if (!normalizedValue) return normalizedValue
  if (aliasMap?.[normalizedValue]) return aliasMap[normalizedValue]

  if (MANAGEMENT_CENTER_ALIASES.includes(normalizedValue)) {
    return campusNames.find((name) => name.includes('最高议事厅')) || MANAGEMENT_CENTER_CANONICAL_NAME
  }

  if (campusNames.includes(normalizedValue)) return normalizedValue

  const endMatch = campusNames.find((name) => name.endsWith(normalizedValue))
  if (endMatch) return endMatch

  const startMatch = campusNames.find((name) => name.startsWith(normalizedValue))
  if (startMatch) return startMatch

  if (!normalizedValue.includes('神殿')) {
    const suffixMatch = campusNames.find((name) => name === `${normalizedValue}神殿`)
    if (suffixMatch) return suffixMatch
  }

  return normalizedValue
}

const dedupeCampusesByCanonicalName = (campuses: Campus[]) => {
  const rawNames = campuses.map((campus) => campus.name)
  const deduped = new Map<string, Campus>()

  campuses.forEach((campus) => {
    const canonicalName = normalizeCampusSelectionName(campus.name, rawNames)
    if (deduped.has(canonicalName)) {
      return
    }
    deduped.set(canonicalName, {
      ...campus,
      id: campus.id || canonicalName,
      name: canonicalName,
    })
  })

  return sortCampuses(Array.from(deduped.values()))
}

const buildNormalizedCampuses = (profiles: CampusProfile[], fallbackCampuses: Campus[]) => {
  const palette = ['#1890ff', '#52c41a', '#f5222d', '#faad14', '#722ed1', '#13c2c2']
  const aliasMap = buildCampusAliasMap(profiles)
  const canonicalNames = Array.from(new Set(Object.values(aliasMap).filter(Boolean)))
  const fallbackByCanonical = new Map<string, Campus>()

  fallbackCampuses.forEach((campus) => {
    const canonicalName = normalizeCampusSelectionName(campus.name, canonicalNames, aliasMap)
    if (!fallbackByCanonical.has(canonicalName)) {
      fallbackByCanonical.set(canonicalName, campus)
    }
  })

  const mergedCampuses = new Map<string, Campus>()

  canonicalNames.forEach((name, index) => {
    const fallback = fallbackByCanonical.get(name)
    mergedCampuses.set(name, {
      id: fallback?.id || name,
      code: fallback?.code,
      name,
      website: fallback?.website || '#',
      mobileWebsite: fallback?.mobileWebsite || '#',
      status: fallback?.status || 'active',
      color: fallback?.color || palette[index % palette.length],
    })
  })

  return {
    aliasMap,
    campuses: sortCampuses(Array.from(mergedCampuses.values())),
  }
}

export const useCampusStore = create<CampusState>()(
  persist(
    (set, get) => ({
      // 初始状态
      currentCampus: null,
      campuses: CAMPUSES,

      // 设置当前神殿
      setCampus: (campus: string) => {
        const { campuses } = get()
        const campusNames = (campuses && campuses.length > 0 ? campuses : CAMPUSES).map((item) => item.name)
        const normalizedCampus = normalizeCampusSelectionName(campus, campusNames)
        set({ currentCampus: normalizedCampus })
      },

      // 获取当前神殿信息
      getCurrentCampus: () => {
        const { currentCampus, campuses } = get()
        if (!currentCampus) return null
        return campuses.find((c) => c.name === currentCampus) || null
      },

      // 根据名称获取神殿信息
      getCampusByName: (name: string) => {
        const { campuses } = get()
        const allCampuses = campuses && campuses.length > 0 ? campuses : CAMPUSES
        const normalizedName = normalizeCampusSelectionName(name, allCampuses.map((item) => item.name))
        return allCampuses.find((c) => c.name === normalizedName) || null
      },

      // 获取所有神殿
      getAllCampuses: () => {
        const { campuses } = get()
        // 如果持久化数据异常导致 campuses 为空，回退到默认内置神殿列表
        if (!campuses || campuses.length === 0) {
          return dedupeCampusesByCanonicalName(CAMPUSES)
        }
        // 返回去重并排序后的神殿列表
        return dedupeCampusesByCanonicalName(campuses)
      },

      // 根据用户可访问神殿列表过滤神殿
      getFilteredCampuses: (accessibleCampuses?: string[]) => {
        const { campuses } = get()
        const allCampuses = campuses && campuses.length > 0 ? campuses : CAMPUSES

        // 如果没有提供可访问神殿列表，或列表为空，返回所有神殿
        if (!accessibleCampuses || accessibleCampuses.length === 0) {
          return sortCampuses(allCampuses)
        }

        const campusNames = allCampuses.map((campus) => campus.name)
        const normalizedAccessibleCampuses = Array.from(
          new Set(
            accessibleCampuses
              .map((campus) => normalizeCampusSelectionName(campus, campusNames))
              .filter(Boolean),
          ),
        )

        // 过滤出用户可访问的神殿并排序
        return dedupeCampusesByCanonicalName(
          allCampuses.filter((campus) => normalizedAccessibleCampuses.includes(campus.name))
        )
      },

      // 添加神殿
      addCampus: (campus) => {
        const { campuses } = get()
        const normalizedName = normalizeCampusSelectionName(campus.name, campuses.map((item) => item.name))
        const newCampus: Campus = {
          id: campus.id || `campus-${Date.now()}`,
          name: normalizedName,
          website: campus.website || '#',
          mobileWebsite: campus.mobileWebsite || '#',
          status: campus.status || 'active',
          color: campus.color || '#1890ff',
        }
        set({ campuses: dedupeCampusesByCanonicalName([...campuses, newCampus]) })
      },

      // 更新神殿
      updateCampus: (id, updatedCampus) => {
        const { campuses } = get()
        const nextCampuses = campuses.map((campus) => {
          if (campus.id !== id) return campus
          const normalizedName = updatedCampus.name
            ? normalizeCampusSelectionName(updatedCampus.name, campuses.map((item) => item.name))
            : campus.name
          return { ...campus, ...updatedCampus, name: normalizedName }
        })
        set({
          campuses: dedupeCampusesByCanonicalName(nextCampuses),
        })
      },

      // 删除神殿
      removeCampus: (id) => {
        const { campuses } = get()
        set({ campuses: campuses.filter((c) => c.id !== id) })
      },

      // 从配置中心加载神殿列表
      loadCampusesFromConfig: async () => {
        try {
          const res = await fetchCampuses()
          const fallbackCampuses = get().campuses && get().campuses.length > 0 ? get().campuses : CAMPUSES
          const mapped = buildNormalizedCampuses(res || [], fallbackCampuses).campuses

          if (mapped.length === 0) return

          set((state) => {
            let nextCampus = state.currentCampus
            const campusNames = mapped.map((campus) => campus.name)
            if (nextCampus) {
              nextCampus = normalizeCampusSelectionName(nextCampus, campusNames)
            }

            if (!nextCampus || !mapped.some((c) => c.name === nextCampus)) {
              const campusWithSuffix = mapped.find((c) => c.name.includes('神殿'))
              nextCampus = campusWithSuffix ? campusWithSuffix.name : mapped[0].name
            }
            
            return {
              campuses: mapped,
              currentCampus: nextCampus,
            }
          })
        } catch (error) {
          console.error('加载配置中心神殿失败，已回退默认列表', error)
        }
      },
    }),
    {
      name: 'campus-storage',
      partialize: (state) => ({
        currentCampus: state.currentCampus,
        campuses: state.campuses,
      }),
    },
  ),
)

// 提供统一的神殿名称获取，优先配置中心，兜底内置列表
export const getCampusNamesWithFallback = (): string[] => {
  try {
    const { getAllCampuses } = useCampusStore.getState()
    const names = getAllCampuses()
      .map((c) => c.name)
      .filter(Boolean)
    if (names.length) {
      // 使用排序工具对神殿名称进行排序
      return Array.from(new Set(names))
    }
  } catch (error) {
    console.error('获取神殿名称失败，使用默认列表', error)
  }
  return CAMPUSES.map((c) => c.name)
}

registerApiRuntime({
  getCurrentCampus: () => useCampusStore.getState().currentCampus,
})
