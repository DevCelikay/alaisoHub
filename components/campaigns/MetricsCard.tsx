'use client'

// =====================================================
// MetricsCard Component
// Single metric display with visual indicators
// =====================================================

import { Card, CardContent } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MetricsCardProps {
  label: string
  value: number | string
  format?: 'number' | 'percentage' | 'currency'
  trend?: 'up' | 'down' | 'neutral'
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'gray'
  subtitle?: string
  icon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function MetricsCard({
  label,
  value,
  format = 'number',
  trend,
  color,
  subtitle,
  icon,
  size = 'md',
  className,
}: MetricsCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val

    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'currency':
        return `$${val.toLocaleString()}`
      case 'number':
      default:
        return val.toLocaleString()
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-4 w-4" />
      case 'down':
        return <ArrowDown className="h-4 w-4" />
      case 'neutral':
        return <Minus className="h-4 w-4" />
      default:
        return null
    }
  }

  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'red':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'yellow':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'blue':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'gray':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-foreground'
    }
  }

  const getTrendColorClasses = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'neutral':
        return 'text-gray-600'
      default:
        return ''
    }
  }

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const valueSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className={cn('space-y-2', sizeClasses[size])}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <p
            className={cn(
              'font-bold tracking-tight',
              valueSizeClasses[size],
              color && getColorClasses()
            )}
          >
            {formatValue(value)}
          </p>

          {trend && (
            <span className={cn('flex items-center text-sm', getTrendColorClasses())}>
              {getTrendIcon()}
            </span>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  )
}

// Pre-configured metric cards for common use cases
export function OpenRateCard({ value, ...props }: Omit<MetricsCardProps, 'label' | 'format'>) {
  return (
    <MetricsCard
      label="Open Rate"
      value={value}
      format="percentage"
      color={value > 50 ? 'green' : value > 30 ? 'yellow' : 'red'}
      {...props}
    />
  )
}

export function ReplyRateCard({ value, ...props }: Omit<MetricsCardProps, 'label' | 'format'>) {
  return (
    <MetricsCard
      label="Reply Rate"
      value={value}
      format="percentage"
      color={value > 10 ? 'green' : value > 5 ? 'yellow' : 'red'}
      {...props}
    />
  )
}

export function BounceRateCard({ value, ...props }: Omit<MetricsCardProps, 'label' | 'format'>) {
  return (
    <MetricsCard
      label="Bounce Rate"
      value={value}
      format="percentage"
      color={value < 5 ? 'green' : value < 10 ? 'yellow' : 'red'}
      {...props}
    />
  )
}

export function EmailsSentCard({ value, ...props }: Omit<MetricsCardProps, 'label' | 'format'>) {
  return (
    <MetricsCard
      label="Emails Sent"
      value={value}
      format="number"
      color="blue"
      {...props}
    />
  )
}
