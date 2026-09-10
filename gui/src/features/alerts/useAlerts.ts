import { useQuery } from '@tanstack/react-query'
import { api, NotificationAlert } from '../../lib/api'

export function useAlerts() {
  return useQuery<NotificationAlert[], Error>({
    queryKey: ['alerts'],
    queryFn: () => api.getAlerts(),
    refetchInterval: 15000, // Real-time background refresh every 15s
    staleTime: 10000,
  })
}
