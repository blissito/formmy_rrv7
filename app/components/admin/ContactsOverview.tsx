import { MetricCard } from './MetricCard';

interface ContactSource {
  source: string;
  count: number;
}

interface ContactsData {
  total: number;
  thisWeek: number;
  thisMonth: number;
  bySource: ContactSource[];
}

interface ContactsOverviewProps {
  contacts: ContactsData;
}

export function ContactsOverview({ contacts }: ContactsOverviewProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Total Contactos"
        value={contacts.total.toLocaleString()}
        subtitle="Leads capturados"
        trend={contacts.thisWeek > 0 ? 'positive' : 'neutral'}
      />
      <MetricCard
        title="Esta Semana"
        value={contacts.thisWeek.toLocaleString()}
        subtitle="Nuevos contactos"
        trend={contacts.thisWeek > 0 ? 'positive' : 'neutral'}
      />
      <MetricCard
        title="Este Mes"
        value={contacts.thisMonth.toLocaleString()}
        subtitle="Contactos del mes"
        trend={contacts.thisMonth > 0 ? 'positive' : 'neutral'}
      />
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Por Fuente</h3>
        <div className="space-y-2">
          {contacts.bySource.map((source, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-sm text-gray-700 capitalize">
                {source.source}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {source.count}
              </span>
            </div>
          ))}
          {contacts.bySource.length === 0 && (
            <div className="text-sm text-gray-500 italic">
              Sin contactos aún
            </div>
          )}
        </div>
      </div>
    </section>
  );
}