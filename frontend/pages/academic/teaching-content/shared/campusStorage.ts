// 神殿维度本地存储工具
export const normalizeCampus = (campus?: string | null): string => {
  const name = campus || '主神殿'
  return name.trim()
}

export const shortCampusName = (campus?: string | null): string => {
  const n = normalizeCampus(campus)
  return n.endsWith('神殿') ? n.slice(0, -2) : n
}

export const getScopedKey = (baseKey: string, campus?: string | null): string => {
  const c = normalizeCampus(campus)
  return `${baseKey}__${c}`
}

export function loadCampusData<T>(
  baseKey: string,
  campus?: string | null,
  fallback: T = [] as unknown as T,
): T {
  try {
    const key = getScopedKey(baseKey, campus)
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveCampusData<T>(
  baseKey: string,
  campus: string | null | undefined,
  data: T,
): void {
  try {
    const key = getScopedKey(baseKey, campus)
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // ignore
  }
}
