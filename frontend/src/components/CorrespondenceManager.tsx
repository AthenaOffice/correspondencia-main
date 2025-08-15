import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Edit, 
  Eye,
  Calendar,
  User,
  Building,
  Image
} from 'lucide-react';

export const CorrespondenceManager: React.FC = () => {
  // useData antes do uso de 'correspondences'
  const { correspondences, companies, addCorrespondence, updateCorrespondence } = useData();
  const [formData, setFormData] = useState({
  dataRecebimento: new Date().toISOString().split('T')[0],
  dataAvisoConexaStr: '',
  fotoCorrespondencia: [], // array de imagens base64
  nomeEmpresaConexa: '',
  remetente: '',
  statusCorresp: 'RECEBIDA' as 'RECEBIDA' | 'NOTIFICADA' | 'RETIRADA' | 'DEVOLVIDA',
  });
  const [showForm, setShowForm] = useState(false);
  const [editingCorrespondence, setEditingCorrespondence] = useState<any>(null);
  const [searchTerm] = useState('');
  const [statusFilter] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correspondenceData = {
      dataRecebimento: new Date(formData.dataRecebimento),
      dataAvisoConexsa: formData.dataAvisoConexaStr ? new Date(formData.dataAvisoConexaStr) : undefined,
      fotoCorrespondencia: formData.fotoCorrespondencia && formData.fotoCorrespondencia.length > 0 ? formData.fotoCorrespondencia[0] : undefined,
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
      fotoCorrespondencia: [],
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
      dataAvisoConexaStr: correspondence.dataAvisoConexsa ? new Date(correspondence.dataAvisoConexsa).toISOString().split('T')[0] : '',
      fotoCorrespondencia: correspondence.fotoCorrespondencia ? (Array.isArray(correspondence.fotoCorrespondencia) ? correspondence.fotoCorrespondencia : [correspondence.fotoCorrespondencia]) : [],
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
  // O modal deve estar dentro do return principal, não fora da função

  // O return principal do componente
  return (
    <div className="space-y-6">
      {/* Header com botão Nova Correspondência */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Correspondências</h2>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingCorrespondence(null);
            setFormData({
              dataRecebimento: new Date().toISOString().split('T')[0],
              dataAvisoConexaStr: '',
              fotoCorrespondencia: [],
              nomeEmpresaConexa: '',
              remetente: '',
              statusCorresp: 'RECEBIDA',
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <span className="text-lg font-bold">+</span> Nova Correspondência
        </button>
      </div>
      {/* Modal com formulário igual ao de Nova Empresa */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#23272f] rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Nova Correspondência</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Empresa *</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.nomeEmpresaConexa}
                    onChange={e => setFormData({ ...formData, nomeEmpresaConexa: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-[#23272f] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nome da empresa"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Remetente *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" value={formData.remetente} onChange={(e) => setFormData({ ...formData, remetente: e.target.value })} className="w-full pl-10 pr-4 py-2 bg-[#23272f] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nome do remetente" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Foto/Logo (opcional)</label>
                <div className="flex gap-4 items-center flex-wrap">
                  {formData.fotoCorrespondencia && formData.fotoCorrespondencia.length > 0 && (
                    formData.fotoCorrespondencia.map((img: string, idx: number) => (
                      <img key={idx} src={img} alt={`Preview ${idx+1}`} className="w-16 h-16 object-cover rounded-lg border border-gray-700" />
                    ))
                  )}
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            setFormData(prev => ({
                              ...prev,
                              fotoCorrespondencia: [...(prev.fotoCorrespondencia || []), ev.target?.result as string]
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <span className="px-3 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm">Anexar</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Cadastrar</button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remetente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Recebimento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCorrespondences.length > 0 ? (
                filteredCorrespondences.map((correspondence) => (
                  <tr key={correspondence.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{correspondence.remetente}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{correspondence.nomeEmpresaConexa}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{new Date(correspondence.dataRecebimento).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(correspondence.statusCorresp)}`}>{correspondence.statusCorresp}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(correspondence)} className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        {correspondence.fotoCorrespondencia && (
                          <a href={correspondence.fotoCorrespondencia} target="_blank" rel="noopener noreferrer" className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors" title="Ver foto">
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Nenhuma correspondência encontrada</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}