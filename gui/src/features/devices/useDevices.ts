import { useQuery } from '@tanstack/react-query'
import { api, Device } from '../../lib/api'

export function useDevices() {
  return useQuery<Device[], Error>({
    queryKey: ['devices'],
    queryFn: () => api.getDevices(),
    refetchInterval: 30000,
  })
}
