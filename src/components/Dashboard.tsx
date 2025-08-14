import React from 'react';
import { useData } from '../context/DataContext';
import { 
  Mail, 
  Building2, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  TrendingUp
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { companies, correspondences } = useData();

  const statusCounts = correspondences.reduce((acc, corr) => {
    acc[corr.statusCorresp] = (acc[corr.statusCorresp] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentCorrespondences = correspondences
    .sort((a, b) => new Date(b.dataRecebimento).getTime() - new Date(a.dataRecebimento).getTime())
    .slice(0, 5);

  const stats = [
    {
      title: 'Total Correspondências',
      value: correspondences.length,
      icon: Mail,
      color: 'blue',
      change: '+12%',
    },
    {
      title: 'Empresas Cadastradas',
      value: companies.length,
      icon: Building2,
      color: 'green',
      change: '+5%',
    },
    {
      title: 'Retiradas',
      value: statusCounts.RETIRADA || 0,
      icon: CheckCircle,
      color: 'emerald',
      change: '+8%',
    },
    {
      title: 'Pendentes',
      value: (statusCounts.RECEBIDA || 0) + (statusCounts.NOTIFICADA || 0),
      icon: Clock,
      color: 'orange',
      change: '-3%',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEBIDA': return 'bg-blue-100 text-blue-800';
      case 'NOTIFICADA': return 'bg-yellow-100 text-yellow-800';
      case 'RETIRADA': return 'bg-green-100 text-green-800';
      case 'DEVOLVIDA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center
                  ${stat.color === 'blue' ? 'bg-blue-100' : 
                    stat.color === 'green' ? 'bg-green-100' :
                    stat.color === 'emerald' ? 'bg-emerald-100' : 'bg-orange-100'}
                `}>
                  <Icon className={`
                    w-6 h-6
                    ${stat.color === 'blue' ? 'text-blue-600' : 
                      stat.color === 'green' ? 'text-green-600' :
                      stat.color === 'emerald' ? 'text-emerald-600' : 'text-orange-600'}
                  `} />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">{stat.change}</span>
                <span className="text-gray-600 ml-1">vs mês anterior</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribuição por Status
          </h3>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {status}
                  </div>
                </div>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Correspondences */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Correspondências Recentes
          </h3>
          <div className="space-y-3">
            {recentCorrespondences.length > 0 ? (
              recentCorrespondences.map((corr) => (
                <div key={corr.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{corr.remetente}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(corr.dataRecebimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(corr.statusCorresp)}`}>
                    {corr.statusCorresp}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                Nenhuma correspondência registrada
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};