import { shallowRef } from 'vue'

const privatePaths = ['/equipamentos', '/reservas']
export const location = shallowRef(new URL(window.location.href))

export function isPrivatePath(path: string): boolean {
  return privatePaths.includes(path)
}

export function postLoginPath(): string {
  const next = location.value.searchParams.get('next')
  return next && isPrivatePath(next) ? next : '/equipamentos'
}

export function loginPath(next: string, registered = false): string {
  const params = new URLSearchParams({ next })
  if (registered) params.set('registered', '1')
  return '/login?' + params.toString()
}

export function navigate(path: string, replace = false): void {
  if (replace) window.history.replaceState(null, '', path)
  else window.history.pushState(null, '', path)
  location.value = new URL(window.location.href)
}

export function listenForNavigation(): () => void {
  const update = () => { location.value = new URL(window.location.href) }
  update()
  window.addEventListener('popstate', update)
  return () => window.removeEventListener('popstate', update)
}
