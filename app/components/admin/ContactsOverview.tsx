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
  // Obtener fuente principal
  const topSource = contacts.bySource.length > 0
    ? contacts.bySource.reduce((max, s) => s.count > max.count ? s : max, contacts.bySource[0])
    : null;

  return (
    <section className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Contactos Capturados</h2>
      <div className="flex flex-wrap gap-6 text-sm">
        <div>
          <span className="text-gray-600">Total: </span>
          <span className="font-bold text-2xl text-gray-900">{contacts.total.toLocaleString()}</span>
        </div>
        <div className="border-l pl-6">
          <span className="text-gray-600">Esta semana: </span>
          <span className="font-semibold text-green-600">+{contacts.thisWeek.toLocaleString()}</span>
        </div>
        <div className="border-l pl-6">
          <span className="text-gray-600">Este mes: </span>
          <span className="font-semibold text-blue-600">+{contacts.thisMonth.toLocaleString()}</span>
        </div>
        {topSource && (
          <div className="border-l pl-6">
            <span className="text-gray-600">Top fuente: </span>
            <span className="font-semibold text-gray-900 capitalize">
              {topSource.source} ({topSource.count})
            </span>
          </div>
        )}
      </div>

      {/* Mostrar todas las fuentes si hay más de 1 */}
      {contacts.bySource.length > 1 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex gap-4 text-xs text-gray-600">
            {contacts.bySource.map((source, i) => (
              <div key={i}>
                <span className="capitalize">{source.source}:</span>{' '}
                <span className="font-semibold text-gray-900">{source.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}