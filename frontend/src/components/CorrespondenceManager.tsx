import React, { useEffect, useState } from 'react';
import {
  Edit,
  Eye,
  Calendar,
  User,
  Building,
  Image as ImageIcon,
  Trash
} from 'lucide-react';
import { apagarCorrespondencia, buscarCorrespondencias, salvarCorrespondencia } from '../service/correspondencia';

// Tipos do novo schema
export type StatusCorresp = 'AVISADA' | 'DEVOLVIDA' | 'USO_INDEVIDO' | 'ANALISE';
export interface CorrespondenciaDTO {
  id: number;
  remetente: string;
  nomeEmpresaConexa: string;
  statusCorresp: StatusCorresp;
  dataRecebimento: string; // "YYYY-MM-DD" (string)
  dataAvisoConexa: string | null; // "YYYY-MM-DD" ou null
  fotoCorrespondencia: string | null; // base64 ou url, ou null
  // Remover campos extras, manter apenas os originais
}

export const CorrespondenceManager: React.FC = () => {
  // Estado local baseado na API real
  const [lista, setLista] = useState<CorrespondenciaDTO[]>([]);
  const [carregando, setCarregando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CorrespondenciaDTO | null>(null);

  const [formData, setFormData] = useState<{
    fotoCorrespondencia: string | null; // um único arquivo
    nomeEmpresaConexa: string;
    remetente: string;
    situacao?: string;
    mensagem?: string;
  }>({
    fotoCorrespondencia: null,
    nomeEmpresaConexa: '',
    remetente: '',
    situacao: '',
    mensagem: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | StatusCorresp>('');
  // Remover estados de edição inline de situação/mensagem

  const carregar = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resp = await buscarCorrespondencias();
      // Assumindo resp.content no formato do DTO
      setLista(resp?.content ?? []);
    } catch (e: any) {
      setErro(e?.message ?? 'Falha ao buscar correspondências');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const resetForm = () => {
    setFormData({
      fotoCorrespondencia: null,
      nomeEmpresaConexa: '',
      remetente: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (formData.fotoCorrespondencia) {
        // Se houver foto, enviar como multipart para /processar-correspondencia/receber-com-foto
        const form = new FormData();
        form.append('nomeEmpresa', formData.nomeEmpresaConexa);
        form.append('remetente', formData.remetente);

        // Converter base64 para arquivo Blob
        const base64 = formData.fotoCorrespondencia;
        const arr = base64.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const file = new File([u8arr], 'foto.png', { type: mime });
        form.append('foto', file);

        await fetch('http://localhost:8080/api/correspondencias/processar-correspondencia/receber-com-foto', {
          method: 'POST',
          body: form,
        });
  // Disparar evento para notificar que uma empresa pode ter sido criada/atualizada
  window.dispatchEvent(new CustomEvent('empresaAtualizada'));
      } else {
        // Sem foto, enviar como JSON para /processar-correspondencia
        await fetch('http://localhost:8080/api/correspondencias/processar-correspondencia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nomeEmpresaConexa: formData.nomeEmpresaConexa,
            remetente: formData.remetente,
          }),
        });
  // Disparar evento para notificar que uma empresa pode ter sido criada/atualizada
  window.dispatchEvent(new CustomEvent('empresaAtualizada'));
      }
      await carregar();
      resetForm();
      setShowForm(false);
    } catch (error: any) {
      setErro(error?.message || 'Erro ao cadastrar correspondência');
    }
  };

  const handleEdit = (c: CorrespondenciaDTO) => {
    setEditing(c);
    setFormData({
      fotoCorrespondencia: c.fotoCorrespondencia ?? null,
      nomeEmpresaConexa: c.nomeEmpresaConexa ?? '',
      remetente: c.remetente ?? '',
    });
    setShowForm(true);
  };

  // Remover funções de edição inline de situação/mensagem

  const apagarCorrespondenciaHandle = async (id: string) => {
    try {
      await apagarCorrespondencia(id);
      setLista(prev => prev.filter(c => String(c.id) !== id));
    } catch (error) {
      console.error(error);
    }
  }

  const filtered = lista.filter(c => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      (c.remetente?.toLowerCase() ?? '').includes(s) ||
      (c.nomeEmpresaConexa?.toLowerCase() ?? '').includes(s);
    const matchesStatus = !statusFilter || c.statusCorresp === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: StatusCorresp) => {
    switch (status) {
      case 'ANALISE': return 'bg-blue-100 text-blue-800';
      case 'AVISADA': return 'bg-yellow-100 text-yellow-800';
      case 'DEVOLVIDA': return 'bg-red-100 text-red-800';
      case 'USO_INDEVIDO': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Correspondências</h2>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            className="flex-1 sm:w-64 px-3 py-2 bg-[#23272f] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar por remetente/empresa"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <select
            className="px-3 py-2 bg-[#23272f] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
          >
            <option value="">Todos</option>
            <option value="ANALISE">ANALISE</option>
            <option value="AVISADA">AVISADA</option>
            <option value="DEVOLVIDA">DEVOLVIDA</option>
            <option value="USO_INDEVIDO">USO_INDEVIDO</option>
          </select>
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              resetForm();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <span className="text-lg font-bold">+</span> Nova Correspondência
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#23272f] rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">{editing ? 'Editar' : 'Nova'} Correspondência</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Empresa *</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="primeiroId"
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
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="segundoId"
                    type="text"
                    value={formData.remetente}
                    onChange={e => setFormData({ ...formData, remetente: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-[#23272f] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nome do remetente"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Foto/Logo (opcional)</label>
                <div className="flex items-center gap-3">
                  {formData.fotoCorrespondencia && (
                    // preview básico
                    <img
                      src={formData.fotoCorrespondencia}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-gray-700"
                    />
                  )}
                  <label className="inline-flex items-center cursor-pointer gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = ev => {
                            setFormData(prev => ({ ...prev, fotoCorrespondencia: (ev.target?.result as string) ?? null }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <ImageIcon className="w-4 h-4 text-gray-300" />
                    <span className="px-3 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm">Anexar</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditing(null); }}
                  className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editing ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remetente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Receb.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {carregando ? (
                <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-500">Carregando...</td></tr>
              ) : erro ? (
                <tr><td colSpan={10} className="px-6 py-12 text-center text-red-500">{erro}</td></tr>
              ) : filtered.length > 0 ? (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{c.remetente}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{c.nomeEmpresaConexa}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {(() => {
                        try {
                          const d = new Date(c.dataRecebimento);
                          return isNaN(d.getTime()) ? c.dataRecebimento : d.toLocaleDateString('pt-BR');
                        } catch {
                          return c.dataRecebimento;
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(c.statusCorresp)}`}>{c.statusCorresp}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => apagarCorrespondenciaHandle(String(c.id))}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                        {c.fotoCorrespondencia && (
                          <a
                            href={`http://localhost:8080/api/correspondencias/arquivo/${encodeURIComponent(c.fotoCorrespondencia)}`}
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
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">Nenhuma correspondência encontrada</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
