import type { CookieOptions, Request, Response } from 'express'
import { validateAuthConfig } from './authConfig.js'

const cookieName = 'reservalab_refresh'
const secretFormat = /^[A-Za-z0-9_-]{43}$/

export function readRefreshCookie(request: Request): string | undefined {
  const prefix = `${cookieName}=`
  const cookies = (request.get('Cookie') ?? '').split(';').map(entry => entry.trim())
  const matches = cookies.filter(entry => entry.startsWith(prefix))
  const [cookie] = matches
  if (!cookie || matches.length !== 1) return undefined
  const value = cookie.slice(prefix.length)
  return secretFormat.test(value) ? value : undefined
}

function refreshOptions(): CookieOptions {
  return { httpOnly: true, secure: validateAuthConfig().secureCookie, sameSite: 'lax', path: '/api/auth' }
}

export function setRefreshCookie(response: Response, value: string, expires: Date): void {
  response.cookie(cookieName, value, { ...refreshOptions(), expires })
}

export function clearRefreshCookie(response: Response): void {
  response.clearCookie(cookieName, refreshOptions())
}
