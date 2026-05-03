function SkeletonBlock({ className = '' }) {
  const baseClassName = 'animate-pulse rounded-standard bg-background-alt'

  return <div aria-hidden="true" className={`${baseClassName} ${className}`.trim()} />
}

export default SkeletonBlock
