export default function AppLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-ikori-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-ikori-200 border-t-ikori-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-ikori-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}
