export default function ProgressLoading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-7 bg-navy-light rounded w-32 mb-6" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-navy-light rounded-xl" />
        ))}
      </div>
      <div className="h-40 bg-navy-light rounded-xl mb-6" />
      <div className="h-60 bg-navy-light rounded-xl" />
    </div>
  );
}
