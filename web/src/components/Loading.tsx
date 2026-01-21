import type { ComponentType } from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

export const LoadingSpinner: ComponentType<LoadingSpinnerProps> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} animate-spin rounded-full border-2 border-primary border-t-transparent`} />
    </div>
  )
}

export const PageLoading: ComponentType = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  )
}
