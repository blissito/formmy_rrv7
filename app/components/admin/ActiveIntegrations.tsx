interface Integration {
  platform: string;
  count: number;
}

interface ActiveIntegrationsProps {
  integrations: Integration[];
}

export function ActiveIntegrations({ integrations }: ActiveIntegrationsProps) {
  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Integraciones Activas</h2>
      <div className="space-y-3">
        {integrations.map((integration, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b last:border-b-0">
            <div className="font-medium">{integration.platform}</div>
            <div className="font-semibold">{integration.count}</div>
          </div>
        ))}
      </div>
    </section>
  );
}