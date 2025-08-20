// TODO: trocar o localhost pela var de ambiente (VITE_API_BASE)

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:8080';

function mapCustomerToCompany(customer: any) {
    // Normaliza os campos mais usados pela UI (CompanyManager)
    return {
        id: customer.id ?? customer.customerId ?? null,
        customerId: customer.customerId ?? customer.id ?? null,
        nomeEmpresa: customer.nomeEmpresa ?? customer.name ?? customer.nome ?? null,
        cnpj: customer.cnpj ?? (customer.legalPerson?.cnpj) ?? null,
        email: customer.email ?? customer.emails ?? customer.emailsMessage ?? null,
        telefone: customer.telefone ?? customer.phone ?? null,
        statusEmpresa: customer.statusEmpresa ?? null,
        situacao: customer.situacao ?? null,
        mensagem: customer.mensagem ?? null,
        // preserva payload original caso precise
        __raw: customer,
    };
}

export async function buscarEmpresas(pageNumber: number = 0, pageSize: number = 50){
    // Tenta primeiro o endpoint ATHENA que retorna { content: [...] }
    try {
        const athenaUrl = `${API_BASE}/api/empresas/athena/buscar-todos-registros?pageNumber=${pageNumber}&pageSize=${pageSize}`;
        const resp = await fetch(athenaUrl);
        if (!resp.ok) throw new Error('Resposta ATHENA não OK');
        const json = await resp.json();

        // Se vier no formato esperado (content), retorna diretamente
        if (json && Array.isArray(json.content) && json.content.length > 0) {
            return json; // CompanyManager espera .content
        }

        // Caso ATHENA retorne vazio ou em formato inesperado, tenta o endpoint CONEXA
    const conexaUrl = `${API_BASE}/api/empresas/conexa/buscar-todos-registros?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    const resp2 = await fetch(conexaUrl);
        if (!resp2.ok) throw new Error('Resposta CONEXA não OK');
        const json2 = await resp2.json();

        // Conexa retorna { data: [...] }
        if (json2 && Array.isArray(json2.data)) {
            const mapped = json2.data.map((c: any) => mapCustomerToCompany(c));
            return {
                content: mapped,
                pageNumber: json2.pageNumber ?? 0,
                pageSize: json2.pageSize ?? mapped.length,
                totalElements: json2.totalElements ?? mapped.length,
                totalPages: json2.totalPages ?? 1,
                lastPage: json2.lastPage ?? true,
            };
        }

        // Se nada veio, retorna empty shape
        return { content: [] };
    } catch (error) {
        console.error('Erro buscarEmpresas:', error);
        throw new Error('Erro ao buscar empresas');
    }
}

export async function alterarSituacaoEmpresa(id: number, novaSituacao: string, novaMensagem?: string, novoStatus?: string) {
    try {
        const params: string[] = [];
        if (novoStatus) params.push(`novoStatus=${novoStatus}`);
        if (novaSituacao) params.push(`novaSituacao=${novaSituacao}`);
        if (novaMensagem !== undefined) params.push(`novaMensagem=${encodeURIComponent(novaMensagem)}`);
        const query = params.length ? '?' + params.join('&') : '';
        const url = `${API_BASE}/api/empresas/athena/alterar-empresa/modelo-athena/${id}${query}`;
        const response = await fetch(url, {
            method: 'PUT',
        });
        if (!response.ok) throw new Error('Erro ao alterar situação');
        return response.json();
    } catch (error) {
        console.error(error);
        throw new Error('Erro ao alterar situação');
    }
}

// Busca todas as páginas do endpoint ATHENA (ou CONEXA como fallback) e concatena os resultados
export async function buscarTodasEmpresas(pageSize: number = 50) {
    try {
        // Tenta ATHENA primeiro, iterando páginas
        let all: any[] = [];
        let page = 0;
        while (true) {
            const url = `${API_BASE}/api/empresas/athena/buscar-todos-registros?pageNumber=${page}&pageSize=${pageSize}`;
            const resp = await fetch(url);
            if (!resp.ok) break;
            const json = await resp.json();
            const items = json.content ?? [];
            if (items.length === 0 && page === 0) {
                // ATHENA vazio, tenta CONEXA como fallback (iterando)
                all = [];
                page = 0;
                while (true) {
                    const cUrl = `${API_BASE}/api/empresas/conexa/buscar-todos-registros?pageNumber=${page}&pageSize=${pageSize}`;
                    const cresp = await fetch(cUrl);
                    if (!cresp.ok) break;
                    const cjson = await cresp.json();
                    const citems = cjson.data ?? [];
                    const mapped = citems.map((c: any) => ({
                        id: c.id ?? c.customerId ?? null,
                        customerId: c.customerId ?? c.id ?? null,
                        nomeEmpresa: c.nomeEmpresa ?? c.name ?? c.nome ?? null,
                        cnpj: c.cnpj ?? (c.legalPerson?.cnpj) ?? null,
                        email: c.email ?? c.emails ?? c.emailsMessage ?? null,
                        telefone: c.telefone ?? c.phone ?? null,
                        statusEmpresa: c.statusEmpresa ?? null,
                        situacao: c.situacao ?? null,
                        mensagem: c.mensagem ?? null,
                        __raw: c,
                    }));
                    all = all.concat(mapped);
                    const totalPages = cjson.totalPages ?? (citems.length < pageSize ? page + 1 : page + 1);
                    page++;
                    if (page >= totalPages) break;
                }
                break;
            }

            all = all.concat(items.map((it: any) => ({ ...it })));
            const totalPages = json.totalPages ?? (items.length < pageSize ? page + 1 : page + 1);
            page++;
            if (page >= totalPages) break;
        }

        return { content: all, pageNumber: 0, pageSize, totalElements: all.length, totalPages: 1, lastPage: true };
    } catch (error) {
        console.error('Erro buscarTodasEmpresas:', error);
        throw new Error('Erro ao buscar todas as empresas');
    }
}