import SkeletonBlock from '../atoms/SkeletonBlock.jsx'

const topicRowSkeletonKeys = [
  'topic-row-skeleton-1',
  'topic-row-skeleton-2',
  'topic-row-skeleton-3',
  'topic-row-skeleton-4',
  'topic-row-skeleton-5',
]

const keywordSkeletonKeys = [
  'keyword-skeleton-1',
  'keyword-skeleton-2',
  'keyword-skeleton-3',
]

const detailLineSkeletonKeys = [
  'detail-line-skeleton-1',
  'detail-line-skeleton-2',
  'detail-line-skeleton-3',
  'detail-line-skeleton-4',
]

function TopicReviewSkeleton() {
  return (
    <section
      role="status"
      aria-label="Loading topic review page"
      data-testid="topic-review-skeleton"
    >
      <div className="mb-px16">
        <SkeletonBlock className="h-px12 w-[80px]" />
      </div>

      <div className="mb-px24 flex flex-col gap-px16 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-px8 lg:w-[60%]">
          <SkeletonBlock className="h-px24 w-[55%]" />
          <SkeletonBlock className="h-px12 w-[35%]" />
        </div>

        <div className="flex flex-wrap items-center gap-px8">
          <SkeletonBlock className="h-px32 w-[100px] rounded-pill" />
          <SkeletonBlock className="h-px32 w-[100px] rounded-pill" />
          <SkeletonBlock className="h-px32 w-[100px] rounded-pill" />
        </div>
      </div>

      <div className="mb-px24 rounded-standard border border-border bg-surface p-px16 shadow-card">
        <div className="mb-px8 flex items-center justify-between gap-px16">
          <SkeletonBlock className="h-px12 w-[170px]" />
          <SkeletonBlock className="h-px12 w-[28px]" />
        </div>
        <div className="h-[6px] overflow-hidden rounded-pill bg-background-alt">
          <SkeletonBlock className="h-full w-[40%] rounded-pill" />
        </div>
      </div>

      <div className="flex min-h-[640px] flex-col overflow-hidden rounded-large border border-border bg-surface shadow-deep lg:flex-row">
        <div className="border-b border-border p-px24 lg:w-[42%] lg:border-b-0 lg:border-r">
          <div className="mb-px24 flex flex-col gap-px12 sm:flex-row sm:items-center sm:justify-between">
            <SkeletonBlock className="h-px20 w-[150px]" />
            <div className="flex flex-wrap gap-px8">
              <SkeletonBlock className="h-px32 w-[110px] rounded-pill" />
              <SkeletonBlock className="h-px32 w-[96px] rounded-pill" />
            </div>
          </div>

          <div className="space-y-px8 pr-px2">
            {topicRowSkeletonKeys.map((topicRowSkeletonKey) => (
              <SkeletonBlock key={topicRowSkeletonKey} className="h-px48 w-full rounded-standard" />
            ))}
          </div>
        </div>

        <div className="bg-surface p-px24 lg:w-[58%]">
          <div className="mb-px24 flex flex-col gap-px12 sm:flex-row sm:items-center sm:justify-between">
            <SkeletonBlock className="h-px20 w-[160px]" />
            <SkeletonBlock className="h-px24 w-[140px] rounded-pill" />
          </div>

          <div className="flex min-h-[500px] flex-col justify-center rounded-standard border border-dashed border-border bg-background-alt px-px24 py-px48">
            <div className="mx-auto flex max-w-[320px] flex-wrap justify-center gap-px8">
              {keywordSkeletonKeys.map((keywordSkeletonKey) => (
                <SkeletonBlock
                  key={keywordSkeletonKey}
                  className="h-px24 w-[88px] rounded-pill"
                />
              ))}
            </div>

            <div className="mx-auto mt-px16 w-full max-w-[320px] space-y-px8">
              {detailLineSkeletonKeys.map((detailLineSkeletonKey) => (
                <SkeletonBlock key={detailLineSkeletonKey} className="h-px16 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TopicReviewSkeleton
