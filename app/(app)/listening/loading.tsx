export default function ListeningLoading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-7 bg-ikori-100 rounded w-32 mb-4" />
      <div className="flex gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 bg-ikori-100 rounded-ikori-full w-24" />
        ))}
      </div>
      <div className="h-16 bg-ikori-100 rounded-ikori-sm mb-6" />
      <div className="h-12 bg-ikori-100 rounded-ikori-sm mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-ikori-100 rounded-ikori-sm" />
        ))}
      </div>
    </div>
  );
}
