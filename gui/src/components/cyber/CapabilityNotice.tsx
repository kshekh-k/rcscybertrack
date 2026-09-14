import React from 'react'
import { Terminal } from 'lucide-react'
import { Alert } from '../ui/alert'

interface CapabilityNoticeProps {
  moduleName: string
  expectedEndpoint: string
  description?: string
  className?: string
}

export const CapabilityNotice: React.FC<CapabilityNoticeProps> = ({
  moduleName,
  expectedEndpoint,
  description = 'This interface displays the proposed frontend architecture. Mutation and real-time backend telemetry will become active once the backend service contract is deployed.',
  className = '',
}) => {
  return (
    <Alert
      variant="info"
      className={className}
      title={
        <div className="flex flex-wrap items-center gap-2">
          <span>{moduleName} Service Contract Notice</span>
          <span className="text-3xs uppercase font-mono px-1.5 py-0.5 rounded bg-white/20 text-white font-bold">
            Backend Dependent
          </span>
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row flex-wrap sm:items-center justify-between gap-3 mt-1">
        <p className="text-xs leading-relaxed text-blue-100 max-w-2xl">{description}</p>
        <div className="flex flex-wrap items-center gap-2 font-mono text-2xs bg-black/20 px-3 py-1.5 rounded shrink-0">
          <Terminal className="size-3.5 text-cyan-300 shrink-0" />
          <span className="text-blue-100">Target Endpoint:</span>
          <span className="text-cyan-400 font-semibold">{expectedEndpoint}</span>
        </div>
      </div>
    </Alert>
  )
}

