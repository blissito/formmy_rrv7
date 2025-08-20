interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  trend: string;
}

export function MetricCard({ title, value, subtitle, trend }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600 mb-1">{subtitle}</div>
      <div className="text-xs text-blue-600">{trend}</div>
    </div>
  );
}