import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Eye,
  Calendar,
  User,
  Building,
  Image
} from 'lucide-react';

export const CorrespondenceManager: React.FC = () => {
  const { correspondences, companies, addCorrespondence, updateCorrespondence } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editingCorrespondence, setEditingCorrespondence] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    dataRecebimento: new Date().toISOString().split('T')[0],
    dataAvisoConexaStr: '',
    fotoCorrespondencia: '',
    nomeEmpresaConexa: '',
    remetente: '',
    statusCorresp: 'RECEBIDA' as 'RECEBIDA' | 'NOTIFICADA' | 'RETIRADA' | 'DEVOLVIDA',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const correspondenceData = {
      dataRecebimento: new Date(formData.dataRecebimento),
      dataAvisoConexsa: formData.dataAvisoConexaStr ? new Date(formData.dataAvisoConexaStr) : undefined,
      fotoCorrespondencia: formData.fotoCorrespondencia || undefined,
      nomeEmpresaConexa: formData.nomeEmpresaConexa,
      remetente: formData.remetente,
      statusCorresp: formData.statusCorresp,
    };

    if (editingCorrespondence) {
      updateCorrespondence(editingCorrespondence.id, correspondenceData);
      setEditingCorrespondence(null);
    } else {
      addCorrespondence(correspondenceData);
    }

    setFormData({
      dataRecebimento: new Date().toISOString().split('T')[0],
      dataAvisoConexaStr: '',
      fotoCorrespondencia: '',
      nomeEmpresaConexa: '',
      remetente: '',
      statusCorresp: 'RECEBIDA',
    });
    setShowForm(false);
  };

  const handleEdit = (correspondence: any) => {
    setEditingCorrespondence(correspondence);
    setFormData({
      dataRecebimento: new Date(correspondence.dataRecebimento).toISOString().split('T')[0],
      dataAvisoConexaStr: correspondence.dataAvisoConexsa ? 
        new Date(correspondence.dataAvisoConexsa).toISOString().split('T')[0] : '',
      fotoCorrespondencia: correspondence.fotoCorrespondencia || '',
      nomeEmpresaConexa: correspondence.nomeEmpresaConexa,
      remetente: correspondence.remetente,
      statusCorresp: correspondence.statusCorresp,
    });
    setShowForm(true);
  };

  const filteredCorrespondences = correspondences.filter(corr => {
    const matchesSearch = corr.remetente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         corr.nomeEmpresaConexa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || corr.statusCorresp === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Correspondências</h2>
          <p className="text-gray-600">Gerencie todas as correspondências recebidas</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingCorrespondence(null);
            setFormData({
              dataRecebimento: new Date().toISOString().split('T')[0],
              dataAvisoConexaStr: '',
              fotoCorrespondencia: '',
              nomeEmpresaConexa: '',
              remetente: '',
              statusCorresp: 'RECEBIDA',
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Correspondência
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por remetente ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="RECEBIDA">Recebida</option>
              <option value="NOTIFICADA">Notificada</option>
              <option value="RETIRADA">Retirada</option>
              <option value="DEVOLVIDA">Devolvida</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCorrespondence ? 'Editar Correspondência' : 'Nova Correspondência'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Recebimento *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.dataRecebimento}
                      onChange={(e) => setFormData({ ...formData, dataRecebimento: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data do Aviso à Conexa
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.dataAvisoConexaStr}
                      onChange={(e) => setFormData({ ...formData, dataAvisoConexaStr: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remetente *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.remetente}
                    onChange={(e) => setFormData({ ...formData, remetente: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nome do remetente"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa Conexa *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={formData.nomeEmpresaConexa}
                    onChange={(e) => setFormData({ ...formData, nomeEmpresaConexa: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione uma empresa</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.nome}>
                        {company.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.statusCorresp}
                  onChange={(e) => setFormData({ ...formData, statusCorresp: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="RECEBIDA">Recebida</option>
                  <option value="NOTIFICADA">Notificada</option>
                  <option value="RETIRADA">Retirada</option>
                  <option value="DEVOLVIDA">Devolvida</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto da Correspondência
                </label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={formData.fotoCorrespondencia}
                    onChange={(e) => setFormData({ ...formData, fotoCorrespondencia: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="URL da foto (opcional)"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingCorrespondence ? 'Salvar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Correspondence List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remetente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Recebimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCorrespondences.length > 0 ? (
                filteredCorrespondences.map((correspondence) => (
                  <tr key={correspondence.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {correspondence.remetente}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {correspondence.nomeEmpresaConexa}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {new Date(correspondence.dataRecebimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(correspondence.statusCorresp)}`}>
                        {correspondence.statusCorresp}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(correspondence)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {correspondence.fotoCorrespondencia && (
                          <a
                            href={correspondence.fotoCorrespondencia}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                            title="Ver foto"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Nenhuma correspondência encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};