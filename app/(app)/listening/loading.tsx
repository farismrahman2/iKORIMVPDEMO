export default function ListeningLoading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-7 bg-navy-light rounded w-32 mb-4" />
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 bg-navy-light rounded-full w-24" />
        ))}
      </div>
      <div className="h-16 bg-navy-light rounded-lg mb-6" />
      <div className="h-12 bg-navy-light rounded-lg mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-navy-light rounded-lg" />
        ))}
      </div>
    </div>
  );
}
