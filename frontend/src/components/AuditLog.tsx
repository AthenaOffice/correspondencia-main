import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Calendar, Search, Filter, FileText, Building, Mail } from 'lucide-react';

export const AuditLog: React.FC = () => {
  const { auditLogs } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.detalhe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.acaoRealizada.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEntity = !entityFilter || log.entidade === entityFilter;
    const matchesAction = !actionFilter || log.acaoRealizada === actionFilter;
    return matchesSearch && matchesEntity && matchesAction;
  });

  const sortedLogs = filteredLogs.sort((a, b) => 
    new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
  );

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'COMPANY': return Building;
      case 'CORRESPONDENCE': return Mail;
      default: return FileText;
    }
  };

  const getEntityColor = (entity: string) => {
    switch (entity) {
      case 'COMPANY': return 'bg-green-100 text-green-800';
      case 'CORRESPONDENCE': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CRIAR': return 'bg-emerald-100 text-emerald-800';
      case 'ATUALIZAR': return 'bg-yellow-100 text-yellow-800';
      case 'EXCLUIR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Auditoria</h2>
        <p className="text-gray-600">Histórico de todas as ações realizadas no sistema</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ação ou detalhe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas as entidades</option>
              <option value="COMPANY">Empresa</option>
              <option value="CORRESPONDENCE">Correspondência</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas as ações</option>
              <option value="CRIAR">Criar</option>
              <option value="ATUALIZAR">Atualizar</option>
              <option value="EXCLUIR">Excluir</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalhes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedLogs.length > 0 ? (
                sortedLogs.map((log) => {
                  const EntityIcon = getEntityIcon(log.entidade);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div>{new Date(log.dataHora).toLocaleDateString('pt-BR')}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(log.dataHora).toLocaleTimeString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <EntityIcon className="w-4 h-4 text-gray-500" />
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEntityColor(log.entidade)}`}>
                            {log.entidade === 'COMPANY' ? 'Empresa' : 'Correspondência'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.acaoRealizada)}`}>
                          {log.acaoRealizada}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.detalhe || '-'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    Nenhum registro de auditoria encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      {sortedLogs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {auditLogs.filter(log => log.acaoRealizada === 'CRIAR').length}
              </div>
              <div className="text-sm text-gray-600">Registros Criados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {auditLogs.filter(log => log.acaoRealizada === 'ATUALIZAR').length}
              </div>
              <div className="text-sm text-gray-600">Registros Atualizados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {auditLogs.filter(log => log.acaoRealizada === 'EXCLUIR').length}
              </div>
              <div className="text-sm text-gray-600">Registros Excluídos</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};