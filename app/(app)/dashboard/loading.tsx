export default function DashboardLoading() {
  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 animate-pulse">
      <div>
        <div className="h-4 bg-ikori-100 rounded-ikori-sm w-24 mb-2" />
        <div className="h-7 bg-ikori-100 rounded-ikori-sm w-40" />
      </div>
      <div className="h-24 bg-ikori-100 rounded-ikori" />
      <div className="card space-y-3">
        <div className="h-4 bg-ikori-100 rounded-ikori-sm w-32" />
        <div className="h-12 bg-ikori-surface rounded-ikori-sm" />
        <div className="h-12 bg-ikori-surface rounded-ikori-sm" />
        <div className="h-12 bg-ikori-surface rounded-ikori-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-ikori-100 rounded-ikori" />
        <div className="h-16 bg-ikori-100 rounded-ikori" />
        <div className="h-16 bg-ikori-100 rounded-ikori" />
        <div className="h-16 bg-ikori-100 rounded-ikori" />
      </div>
    </div>
  );
}
