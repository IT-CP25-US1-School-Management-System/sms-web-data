import { ROUTE_NAMES } from '@/lib/constants'
import type { Router } from 'vue-router'

const PA_RETURN_KEY = 'pa-login-return'
const PA_ROUTES: readonly string[] = [
  ROUTE_NAMES.MANAGE_PA,
  ROUTE_NAMES.MANAGE_PA_DETAIL,
  ROUTE_NAMES.MANAGE_PA_FILES,
  ROUTE_NAMES.WEB_PA,
  ROUTE_NAMES.WEB_PA_DETAIL,
  ROUTE_NAMES.WEB_PA_FILES,
]

export function rememberPALoginReturn(name: unknown, fullPath: string) {
  if (typeof name !== 'string' || !PA_ROUTES.includes(name)) return
  // Only a navigation path is stored, never credentials or tokens.
  try {
    sessionStorage.setItem(PA_RETURN_KEY, fullPath)
  } catch {
    /* Storage may be disabled. */
  }
}

export function consumePALoginReturn(router: Router) {
  try {
    const path = sessionStorage.getItem(PA_RETURN_KEY)
    sessionStorage.removeItem(PA_RETURN_KEY)
    if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null
    const target = router.resolve(path)
    return typeof target.name === 'string' && PA_ROUTES.includes(target.name)
      ? target.fullPath
      : null
  } catch {
    return null
  }
}
