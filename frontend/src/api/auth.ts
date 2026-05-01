import client from './client'
import type { User } from '../types'

export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
  const { data } = await client.post('/auth/login', { username, password })
  return data
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout')
  localStorage.removeItem('token')
}

export async function getMe(): Promise<User> {
  const { data } = await client.get('/auth/me')
  return data
}
