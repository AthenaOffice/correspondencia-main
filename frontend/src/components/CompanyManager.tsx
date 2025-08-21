import React, { useEffect, useState } from 'react';
import { Search, Building } from 'lucide-react';
// buscamos dinamicamente todas as empresas via importar função buscarTodasEmpresas quando necessário

export const CompanyManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [empresas, setEmpresas] = useState<any[]>([]);
  // carregar todas as empresas (sem paginação na UI para mostrar tudo cadastrado via correspondência)
  const [editSituacaoId, setEditSituacaoId] = useState<number | null>(null);
  const [editSituacao, setEditSituacao] = useState('');
  const [editMensagemId, setEditMensagemId] = useState<number | null>(null);
  const [editMensagem, setEditMensagem] = useState('');
  const filteredEmpresas = Array.isArray(empresas)
    ? empresas.filter((company: any) => {
        if (!searchTerm) return true;
        // Athena: nomeEmpresa
        return (company.nomeEmpresa || '').toLowerCase().includes(searchTerm.toLowerCase());
      })
    : [];

  // Removido filteredCompanies, usar apenas filteredEmpresas

  const buscarEmpresasList = async () => {
    try {
  const empresas = await (await import('../service/empresa')).buscarTodasEmpresas(50);
      console.log(empresas);
      // Athena: empresas vêm em empresas.content
  setEmpresas(empresas.content || []);
  // sempre mostramos tudo no UI
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    buscarEmpresasList();

    const handler = () => {
      console.debug('[CompanyManager] evento empresaAtualizada recebido - atualizando lista');
      buscarEmpresasList();
    };

    console.debug('[CompanyManager] registrando listener empresaAtualizada');
    window.addEventListener('empresaAtualizada', handler as EventListener);
    return () => {
      console.debug('[CompanyManager] removendo listener empresaAtualizada');
      window.removeEventListener('empresaAtualizada', handler as EventListener);
    };
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
            const isAthena = company.id !== undefined;
            return (
              <div key={company.customerId || company.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {company.nomeEmpresa || '-'}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">CNPJ: {company.cnpj || '-'}</p>
                  <p className="text-sm text-gray-600 truncate">Email: {Array.isArray(company.email) ? company.email[0] : (company.email || '-')}</p>
                  <p className="text-sm text-gray-600 truncate">Telefone: {Array.isArray(company.telefone) ? company.telefone[0] : (company.telefone || '-')}</p>
                  <p className="text-sm text-gray-600 truncate">Status: {company.statusEmpresa ?? '-'}</p>
                  {/* Situação */}
                  <div className="flex items-center gap-2 mt-2">
                    <label className="text-sm font-medium text-gray-700">Situação:</label>
                    {isAthena ? (
                      editSituacaoId === company.id ? (
                        <div className="relative">
                          <button
                            type="button"
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded border"
                            onClick={() => setEditSituacao('OPEN')}
                          >
                            {editSituacao && editSituacao !== 'OPEN' ? editSituacao : 'Selecione'}
                          </button>
                          {editSituacao === 'OPEN' && (
                            <div className="absolute z-10 mt-2 w-40 bg-white border border-gray-300 rounded shadow-lg">
                              {['ATRASO','ADIMPLENTE','INADIMPLENTE','PROTESTADO','CPF','CNPJ'].map(opt => (
                                <button
                                  key={opt}
                                  type="button"
                                  className={`block w-full text-left px-4 py-2 hover:bg-blue-100 ${editSituacao === opt ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                                  onClick={() => setEditSituacao(opt)}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                          <button className="px-2 py-1 bg-blue-600 text-white rounded ml-2" onClick={() => {
                            import('../service/empresa').then(({ alterarSituacaoEmpresa }) => {
                              alterarSituacaoEmpresa(company.id, editSituacao)
                                .then(() => {
                                  setEmpresas(prev => prev.map(c => c.id === company.id ? { ...c, situacao: editSituacao } : c));
                                  setEditSituacaoId(null);
                                })
                                .catch(err => {
                                  alert('Erro ao salvar situação: ' + err.message);
                                });
                            });
                          }}>Salvar</button>
                          <button className="px-2 py-1 bg-gray-400 text-white rounded ml-2" onClick={() => setEditSituacaoId(null)}>Cancelar</button>
                        </div>
                      ) : (
                        <>
                          <span>{company.situacao ?? '-'}</span>
                          {/* Removido botão de edição, apenas exibe o valor vindo do backend */}
                        </>
                      )
                    ) : (
                      <span>{company.situacao ?? '-'}</span>
                    )}
                  </div>
                  {/* Mensagem */}
                                  <div className="flex items-center gap-2 mt-2">
                                    <label className="text-sm font-medium text-gray-700">Mensagem:</label>
                                    {editMensagemId === company.id ? (
                                      <>
                                        <input
                                          type="text"
                                          value={editMensagem}
                                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditMensagem(e.target.value)}
                                          className="px-2 py-1 border rounded"
                                        />
                                        <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => {
                                          import('../service/empresa').then(({ alterarSituacaoEmpresa }) => {
                                            alterarSituacaoEmpresa(company.id, company.situacao ?? '', editMensagem)
                                              .then(() => {
                                                setEmpresas(prev => prev.map(c => c.id === company.id ? { ...c, mensagem: editMensagem } : c));
                                                setEditMensagemId(null);
                                              })
                                              .catch(err => {
                                                alert('Erro ao salvar mensagem: ' + err.message);
                                              });
                                          });
                                        }}>Salvar</button>
                                        <button className="px-2 py-1 bg-gray-400 text-white rounded" onClick={() => setEditMensagemId(null)}>Cancelar</button>
                                      </>
                                    ) : (
                                      <>
                                        <span>{company.mensagem ?? '-'}</span>
                                        <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={() => {
                                          setEditMensagemId(company.id);
                                          setEditMensagem(company.mensagem ?? '');
                                        }}>Editar</button>
                                      </>
                                    )}
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
  {/* mostramos todas as empresas; sem paginação */}
    </div>
  );
};