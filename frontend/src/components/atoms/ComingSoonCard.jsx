function ComingSoonCard({ title }) {
  return (
    <article className="rounded-standard border border-dashed border-border bg-background-alt p-px16">
      <div className="mb-px8 inline-flex rounded-pill bg-background px-px8 py-px4 text-micro font-semibold text-text-muted">
        Coming in Capstone
      </div>
      <h3 className="text-caption font-semibold text-text-primary">{title}</h3>
      <p className="mt-px8 text-micro text-text-secondary">
        Placeholder panel only. Live data and actions will be enabled in the Capstone scope.
      </p>
    </article>
  )
}

export default ComingSoonCard
