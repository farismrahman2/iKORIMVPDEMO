"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-ikori-white">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-display font-bold text-ikori-dark mb-2">Something went wrong</h2>
        <p className="text-ikori-muted text-sm mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button onClick={reset} className="btn-primary">
          Try Again
        </button>
      </div>
    </div>
  );
}
