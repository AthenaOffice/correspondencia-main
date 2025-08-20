import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company, Correspondence, AuditLog } from '../types';

interface DataContextType {
  companies: Company[];
  correspondences: Correspondence[];
  auditLogs: AuditLog[];
  auditPageNumber: number;
  auditPageSize: number;
  auditTotalPages: number;
  loadAuditPage: (pageNumber: number) => Promise<void>;
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => void;
  addCorrespondence: (correspondence: Omit<Correspondence, 'id'>) => void;
  updateCorrespondence: (id: number, updates: Partial<Correspondence>) => void;
  deleteCompany: (id: number) => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'dataHora'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [correspondences, setCorrespondences] = useState<Correspondence[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPageNumber, setAuditPageNumber] = useState<number>(0);
  const [auditPageSize] = useState<number>(50);
  const [auditTotalPages, setAuditTotalPages] = useState<number>(0);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);

  useEffect(() => {
    // Carrega a primeira página do histórico ao montar (usa paginação do backend)
    (async () => {
      try {
        await loadAuditPage(0);
      } catch (e) {
        console.warn('Erro ao carregar página inicial do histórico', e);
      }
    })();
  }, []);

  // function to load a specific audit page (used by UI)
  const loadAuditPage = async (pageNumber: number) => {
    try {
      const resp = await fetch(`/api/historicos/todos-processos?pageNumber=${pageNumber}&pageSize=${auditPageSize}&sortBy=dataHora&sortOrder=desc`);
      if (!resp.ok) throw new Error('Erro ao buscar histórico');
      const body = await resp.json();
      const items = body.content || [];
      setAuditLogs(items.map((log: any) => ({ ...log, dataHora: new Date(log.dataHora) })));
      setAuditPageNumber(body.pageNumber ?? pageNumber);
      setAuditTotalPages(body.totalPages ?? 0);
    } catch (e) {
      console.error('Erro ao carregar página do histórico', e);
    }
  };

  // Ouve evento global disparado quando uma empresa pode ter sido criada/atualizada
  useEffect(() => {
    const onEmpresaAtualizada = () => {
      // Adiciona um registro de auditoria local para visibilidade imediata
      addAuditLog({
        entidadeId: Date.now(),
        acaoRealizada: 'CRIAR',
        detalhe: `Empresa criada via correspondência`,
        entidade: 'COMPANY',
      });

      // Recarrega página 0 do histórico (pequeno delay para backend persistir)
      setTimeout(() => {
        loadAuditPage(0).catch(() => {/* ignore */});
      }, 600);

      // Mostrar mensagem de comemoração por alguns segundos
      setCelebrationMessage('Empresa criada com sucesso 🎉');
      setTimeout(() => setCelebrationMessage(null), 3500);
    };

    window.addEventListener('empresaAtualizada', onEmpresaAtualizada as EventListener);
    return () => window.removeEventListener('empresaAtualizada', onEmpresaAtualizada as EventListener);
  }, [/* no deps - functions are stable in this component */]);

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const addCompany = (companyData: Omit<Company, 'id' | 'createdAt'>) => {
    const newCompany: Company = {
      ...companyData,
      id: Date.now(),
      createdAt: new Date(),
    };
    const updatedCompanies = [...companies, newCompany];
    setCompanies(updatedCompanies);
    saveToStorage('companies', updatedCompanies);
    
    addAuditLog({
      entidadeId: newCompany.id,
      acaoRealizada: 'CRIAR',
      detalhe: `Empresa ${newCompany.nome} criada`,
      entidade: 'COMPANY',
    });
  };

  const addCorrespondence = (correspondenceData: Omit<Correspondence, 'id'>) => {
    const newCorrespondence: Correspondence = {
      ...correspondenceData,
      id: Date.now(),
    };
    const updatedCorrespondences = [...correspondences, newCorrespondence];
    setCorrespondences(updatedCorrespondences);
    saveToStorage('correspondences', updatedCorrespondences);
    
    addAuditLog({
      entidadeId: newCorrespondence.id,
      acaoRealizada: 'CRIAR',
      detalhe: `Correspondência de ${newCorrespondence.remetente} registrada`,
      entidade: 'CORRESPONDENCE',
    });
  };

  const updateCorrespondence = (id: number, updates: Partial<Correspondence>) => {
    const updatedCorrespondences = correspondences.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    setCorrespondences(updatedCorrespondences);
    saveToStorage('correspondences', updatedCorrespondences);
    
    addAuditLog({
      entidadeId: id,
      acaoRealizada: 'ATUALIZAR',
      detalhe: `Status alterado para ${updates.statusCorresp}`,
      entidade: 'CORRESPONDENCE',
    });
  };

  const deleteCompany = (id: number) => {
    const company = companies.find(c => c.id === id);
    const updatedCompanies = companies.filter(c => c.id !== id);
    setCompanies(updatedCompanies);
    saveToStorage('companies', updatedCompanies);
    
    if (company) {
      addAuditLog({
        entidadeId: id,
        acaoRealizada: 'EXCLUIR',
        detalhe: `Empresa ${company.nome} excluída`,
        entidade: 'COMPANY',
      });
    }
  };

  const addAuditLog = (logData: Omit<AuditLog, 'id' | 'dataHora'>) => {
    const newLog: AuditLog = {
      ...logData,
      id: Date.now(),
      dataHora: new Date(),
    };
    setAuditLogs((prev) => {
      const updatedLogs = [...prev, newLog];
      saveToStorage('auditLogs', updatedLogs);
      return updatedLogs;
    });
  };

  const value: DataContextType = {
    companies,
    correspondences,
    auditLogs,
  auditPageNumber,
  auditPageSize,
  auditTotalPages,
  loadAuditPage,
    addCompany,
    addCorrespondence,
    updateCorrespondence,
    deleteCompany,
    addAuditLog,
  };

  return (
    <DataContext.Provider value={value}>
      {celebrationMessage && (
        <div className="fixed left-1/2 top-6 -translate-x-1/2 z-50">
          <div className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg">
            {celebrationMessage}
          </div>
        </div>
      )}
      {children}
    </DataContext.Provider>
  );
};