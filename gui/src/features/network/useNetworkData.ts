import { useQuery } from '@tanstack/react-query'
import { api, InterfaceConfig, RouteConfig } from '../../lib/api'

export function useNetworkInterfaces() {
  return useQuery<InterfaceConfig[], Error>({
    queryKey: ['network-interfaces'],
    queryFn: () => api.getNetworkInterfaces(),
    refetchInterval: 30000,
  })
}

export function useNetworkRoutes() {
  return useQuery<RouteConfig[], Error>({
    queryKey: ['network-routes'],
    queryFn: () => api.getNetworkRoutes(),
    refetchInterval: 30000,
  })
}
