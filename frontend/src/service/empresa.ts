//todo: trocar o localhost pela var de ambiente que recebe o dominio


export async function buscarEmpresas(){
    try {
    const response = await fetch('http://localhost:8080/api/empresas/athena/buscar-todos-registros?pageSize=100');
        if (!response.ok) throw new Error('Erro ao buscar empresas');
        return response.json();
    } catch (error) {
        console.error(error);
        throw new Error('Erro ao buscar empresas');
    }
}

export async function alterarSituacaoEmpresa(id: number, novaSituacao: string, novaMensagem?: string, novoStatus?: string) {
    try {
        const params = [];
    if (novoStatus) params.push(`novoStatus=${novoStatus}`);
    if (novaSituacao) params.push(`novaSituacao=${novaSituacao}`);
        if (novaMensagem !== undefined) params.push(`novaMensagem=${encodeURIComponent(novaMensagem)}`);
        const query = params.length ? '?' + params.join('&') : '';
        const response = await fetch(`http://localhost:8080/api/empresas/athena/alterar-empresa/modelo-athena/${id}${query}`, {
            method: 'PUT',
        });
        if (!response.ok) throw new Error('Erro ao alterar situação');
        return response.json();
    } catch (error) {
        console.error(error);
        throw new Error('Erro ao alterar situação');
    }
}