import { useQuery } from '@tanstack/react-query'
import { api, FirewallRule } from '../../lib/api'

export function useFirewallRules() {
  return useQuery<FirewallRule[], Error>({
    queryKey: ['firewall-rules'],
    queryFn: () => api.getFirewallRules(),
    refetchInterval: 30000,
  })
}
