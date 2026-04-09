export default function ExamLoading() {
  return (
    <div className="px-4 py-6 animate-pulse">
      <div className="h-7 bg-ikori-100 rounded w-32 mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-ikori-100 rounded-ikori" />
        ))}
      </div>
    </div>
  );
}
