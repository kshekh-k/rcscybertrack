import { useQuery } from '@tanstack/react-query'
import { api, HealthResponse, SystemInfo } from '../../lib/api'

export function useSystemHealth() {
  return useQuery<HealthResponse, Error>({
    queryKey: ['system-health'],
    queryFn: () => api.getHealth(),
    refetchInterval: 30000,
  })
}

export function useSystemInfo() {
  return useQuery<SystemInfo, Error>({
    queryKey: ['system-info'],
    queryFn: () => api.getSystemInfo(),
    refetchInterval: 30000,
  })
}
