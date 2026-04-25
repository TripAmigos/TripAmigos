import Link from 'next/link'
import { MapPin } from 'lucide-react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  linkTo?: string
}

export function Logo({ size = 'md', linkTo = '/' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  }

  const iconSizes = {
    sm: 24,
    md: 28,
    lg: 32,
  }

  const content = (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} rounded-lg bg-accent flex items-center justify-center flex-shrink-0`}>
        <MapPin size={iconSizes[size]} className="text-white" />
      </div>
      {size !== 'sm' && (
        <span className="font-semibold text-primary">Trip<span className="text-accent">Amigos</span></span>
      )}
    </div>
  )

  if (linkTo) {
    return <Link href={linkTo}>{content}</Link>
  }

  return content
}
