import React from 'react'
import { Info, Terminal } from 'lucide-react'

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
    <div
      className={`bg-indigo-950/20  rounded-xl p-4 my-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-200/90 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5 sm:mt-0">
          <Info className="size-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">{moduleName} Service Contract Notice</span>
            <span className="text-3xs uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 ">
              Backend Dependent
            </span>
          </div>
          <p className="mt-1 text-slate-300 leading-relaxed text-2xs max-w-2xl">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 font-mono text-2xs bg-slate-900/80 px-3 py-1.5 rounded-lg shrink-0">
        <Terminal className="size-3.5 text-cyan-400" />
        <span className="text-slate-400">Target Endpoint:</span>
        <span className="text-cyan-300 font-semibold">{expectedEndpoint}</span>
      </div>
    </div>
  )
}
