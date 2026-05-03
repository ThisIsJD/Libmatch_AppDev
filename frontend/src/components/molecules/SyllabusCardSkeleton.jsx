import SkeletonBlock from '../atoms/SkeletonBlock.jsx'

function SyllabusCardSkeleton() {
  return (
    <article
      role="status"
      aria-label="Loading syllabus"
      className="rounded-comfortable border border-border bg-surface p-px24 shadow-card"
    >
      <div className="flex items-start justify-between gap-px12">
        <SkeletonBlock className="h-[40px] w-[40px] rounded-standard" />
        <SkeletonBlock className="h-px24 w-[60px] rounded-pill" />
      </div>

      <div className="mt-px16 space-y-px8">
        <SkeletonBlock className="h-px16 w-[75%]" />
        <SkeletonBlock className="h-px12 w-[50%]" />
      </div>

      <div className="mt-px24 space-y-px12">
        <SkeletonBlock className="h-px12 w-[40%]" />
        <SkeletonBlock className="h-px32 w-full rounded-micro" />
      </div>
    </article>
  )
}

export default SyllabusCardSkeleton
