export default function FlashcardsLoading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-7 bg-navy-light rounded w-32 mb-6" />
      <div className="h-64 bg-navy-light rounded-2xl mb-6" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-navy-light rounded-lg" />
        ))}
      </div>
    </div>
  );
}
