import { ArrowPathIcon, CheckCircleIcon, CurrencyDollarIcon, UserGroupIcon } from "@heroicons/react/24/outline";

interface ReferralStatsProps {
  totalReferrals: number;
  completedReferrals: number;
  pendingCredits: number;
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon,
  color = 'blue'
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType;
  color?: 'blue' | 'green' | 'purple' | 'yellow';
}) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    yellow: 'bg-yellow-50 text-yellow-700',
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${colors[color]}`}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
};

export function ReferralStats({ 
  totalReferrals, 
  completedReferrals, 
  pendingCredits 
}: ReferralStatsProps) {
  const stats = [
    { 
      name: 'Referidos Totales', 
      value: totalReferrals,
      icon: UserGroupIcon,
      color: 'blue' as const
    },
    { 
      name: 'Conversiones Exitosas', 
      value: completedReferrals,
      icon: CheckCircleIcon,
      color: 'green' as const
    },
    { 
      name: 'Créditos Pendientes', 
      value: pendingCredits,
      icon: CurrencyDollarIcon,
      color: 'purple' as const
    },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Estadísticas de Referidos</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.name}
            title={stat.name}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>
    </div>
  );
}
