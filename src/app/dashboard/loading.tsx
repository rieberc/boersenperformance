export default function DashboardLoading() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg animate-pulse bg-background px-5 pt-6">
      <div className="mb-4 h-6 w-32 rounded bg-border" />
      <div className="mb-4 h-40 rounded-2xl bg-border" />
      <div className="mb-4 h-48 rounded-2xl bg-border" />
      <div className="h-64 rounded-2xl bg-border" />
    </div>
  );
}
