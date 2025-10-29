export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Users</div>
          <div className="text-2xl font-bold">—</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Orders</div>
          <div className="text-2xl font-bold">—</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Revenue</div>
          <div className="text-2xl font-bold">—</div>
        </div>
      </div>
    </div>
  )
}


