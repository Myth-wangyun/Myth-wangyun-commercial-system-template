export interface ApiRuntimeBridge {
  getCurrentCampus?: () => string | null
  onAccessTokenRefreshed?: (token: string | null) => void
  handleAuthExpired?: (message?: string) => void | Promise<void>
}

const runtimeBridge: ApiRuntimeBridge = {}

export const registerApiRuntime = (bridge: ApiRuntimeBridge) => {
  Object.assign(runtimeBridge, bridge)
}

export const getRuntimeCampus = () => runtimeBridge.getCurrentCampus?.() ?? null

export const notifyRuntimeTokenRefreshed = (token: string | null) => {
  runtimeBridge.onAccessTokenRefreshed?.(token)
}

export const handleRuntimeAuthExpired = async (message?: string) => {
  if (!runtimeBridge.handleAuthExpired) {
    return false
  }

  await runtimeBridge.handleAuthExpired(message)
  return true
}
