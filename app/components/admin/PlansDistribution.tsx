interface Plan {
  plan: string;
  count: number;
}

interface PlansDistributionProps {
  plans: Plan[];
}

export function PlansDistribution({ plans }: PlansDistributionProps) {
  return (
    <section className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Distribución de Planes</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {plans.map((plan) => (
          <div key={plan.plan} className="text-center">
            <div className="text-2xl font-bold text-blue-600">{plan.count}</div>
            <div className="text-sm text-gray-600">{plan.plan}</div>
          </div>
        ))}
      </div>
    </section>
  );
}