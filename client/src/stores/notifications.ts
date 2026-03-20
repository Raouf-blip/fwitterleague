import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface Notification {
  id: number
  message: string
  type: NotificationType
}

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])

  function show(message: string, type: NotificationType = 'success', duration = 4000) {
    const id = Date.now()
    notifications.value.push({ id, message, type })

    setTimeout(() => {
      remove(id)
    }, duration)
  }

  function remove(id: number) {
    notifications.value = notifications.value.filter(n => n.id !== id)
  }

  return { notifications, show, remove }
})
