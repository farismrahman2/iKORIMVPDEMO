export default function DashboardLoading() {
  return (
    <div className="px-4 py-6 space-y-6 animate-pulse">
      {/* Greeting skeleton */}
      <div>
        <div className="h-4 bg-navy-light rounded w-24 mb-2" />
        <div className="h-7 bg-navy-light rounded w-40" />
      </div>
      {/* Band skeleton */}
      <div className="h-24 bg-navy-light rounded-xl" />
      {/* Missions skeleton */}
      <div className="bg-navy-light rounded-xl p-4 space-y-3">
        <div className="h-4 bg-navy-lighter rounded w-32" />
        <div className="h-12 bg-navy-lighter rounded-lg" />
        <div className="h-12 bg-navy-lighter rounded-lg" />
        <div className="h-12 bg-navy-lighter rounded-lg" />
      </div>
      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-navy-light rounded-xl" />
        <div className="h-16 bg-navy-light rounded-xl" />
        <div className="h-16 bg-navy-light rounded-xl" />
        <div className="h-16 bg-navy-light rounded-xl" />
      </div>
    </div>
  );
}
