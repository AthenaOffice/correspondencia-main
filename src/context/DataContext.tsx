import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company, Correspondence, AuditLog } from '../types';

interface DataContextType {
  companies: Company[];
  correspondences: Correspondence[];
  auditLogs: AuditLog[];
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

  useEffect(() => {
    // Carregar dados do localStorage
    const storedCompanies = localStorage.getItem('companies');
    const storedCorrespondences = localStorage.getItem('correspondences');
    const storedAuditLogs = localStorage.getItem('auditLogs');

    if (storedCompanies) {
      setCompanies(JSON.parse(storedCompanies));
    }
    if (storedCorrespondences) {
      setCorrespondences(JSON.parse(storedCorrespondences).map((c: any) => ({
        ...c,
        dataRecebimento: new Date(c.dataRecebimento),
        dataAvisoConexa: c.dataAvisoConexa ? new Date(c.dataAvisoConexa) : undefined,
      })));
    }
    if (storedAuditLogs) {
      setAuditLogs(JSON.parse(storedAuditLogs).map((log: any) => ({
        ...log,
        dataHora: new Date(log.dataHora),
      })));
    }
  }, []);

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
    const updatedLogs = [...auditLogs, newLog];
    setAuditLogs(updatedLogs);
    saveToStorage('auditLogs', updatedLogs);
  };

  const value: DataContextType = {
    companies,
    correspondences,
    auditLogs,
    addCompany,
    addCorrespondence,
    updateCorrespondence,
    deleteCompany,
    addAuditLog,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};