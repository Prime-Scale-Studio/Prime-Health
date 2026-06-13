'use client'
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-sm text-muted-foreground">Something went wrong.</p>
      <button
        onClick={reset}
        className="text-sm text-primary underline"
      >
        Try again
      </button>
    </div>
  )
}
