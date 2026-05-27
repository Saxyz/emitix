import { api } from './client'

export interface NotificationItem {
  id: string
  type: "warning" | "success" | "info" | "default"
  title: string
  message: string
  createdAt: string
  unread: boolean
}

export const notificationsApi = {
  getRecent: () => api.get<NotificationItem[]>('/api/notifications'),
}
