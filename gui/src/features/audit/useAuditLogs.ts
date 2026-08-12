import { useQuery } from '@tanstack/react-query'
import { api, AuditLogResponse } from '../../lib/api'

export function useAuditLogs() {
  return useQuery<AuditLogResponse, Error>({
    queryKey: ['audit-logs'],
    queryFn: () => api.getAuditLogs(),
    refetchInterval: 30000,
  })
}
