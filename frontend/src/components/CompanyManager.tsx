import React, { useEffect, useState } from 'react';
import { Search, Building } from 'lucide-react';
import { buscarEmpresas } from '../service/empresa';

export const CompanyManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [editSituacaoId, setEditSituacaoId] = useState<number | null>(null);
  const [editSituacao, setEditSituacao] = useState('');
  const [editMensagemId, setEditMensagemId] = useState<number | null>(null);
  const [editMensagem, setEditMensagem] = useState('');
  const filteredEmpresas = Array.isArray(empresas)
    ? empresas.filter((company: any) => {
        if (!searchTerm) return true;
        return company.name?.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : [];

  // Removido filteredCompanies, usar apenas filteredEmpresas

  const buscarEmpresasList = async () => {
    try {
      const empresas = await buscarEmpresas();
      console.log(empresas)
      // Se vier { data: [...] }, pega o array, senão usa o próprio resultado
      setEmpresas(Array.isArray(empresas) ? empresas : (empresas.data || []));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    buscarEmpresasList();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Empresas</h2>
          <p className="text-gray-600">Gerencie as empresas cadastradas no sistema</p>
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow"
          onClick={buscarEmpresasList}
        >
          Atualizar
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar empresa ou remetente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

  {/* Modais removidos, mantendo apenas listagem e edição */}

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmpresas.length > 0 ? (
          filteredEmpresas.map((company: any) => {
            console.log('Renderizando empresa:', company);
            return (
              <div key={company.customerId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {company.name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">Email: {company.emailsMessage?.[0] || '-'}</p>
                  <p className="text-sm text-gray-600 truncate">Telefone: {company.phones?.[0] || '-'}</p>
                  {/* Situação */}
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-sm font-medium text-gray-700">Situação:</label>
                    {/* ...código de edição de situação... */}
                  </div>
                  {/* Mensagem */}
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-sm font-medium text-gray-700">Mensagem:</label>
                    {/* ...código de edição de mensagem... */}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};