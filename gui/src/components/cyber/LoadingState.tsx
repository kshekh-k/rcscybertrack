import React from 'react'

interface LoadingSkeletonProps {
  className?: string
}

export const Skeleton: React.FC<LoadingSkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return (
    <div className={`bg-slate-800/60 animate-pulse rounded ${className}`} />
  )
}

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="size-8 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      <div className="h-10 bg-app-bg rounded-lg animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-surface/50 rounded-lg animate-pulse" />
      ))}
    </div>
  )
}
