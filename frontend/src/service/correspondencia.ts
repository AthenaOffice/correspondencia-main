//todo: trocar o localhost pela var de ambiente que recebe o dominio

export async function buscarCorrespondencias(pageNumber: number = 0, pageSize: number = 50){
    try {
        const url = `http://localhost:8080/api/correspondencias/listar-correspondencia?pageNumber=${pageNumber}&pageSize=${pageSize}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao buscar correspondências');

        return response.json();
    } catch (error) {
        console.error(error);
        throw new Error('Erro ao buscar correspondências');
    }
}
// Nota: criação de correspondências é feita via endpoints /processar-correspondencia (com ou sem foto).

export async function apagarCorrespondencia(id: string | number){
    try {
        const response = await fetch(`http://localhost:8080/api/correspondencias/${id}`, {
            method: 'DELETE',
        });
    if (!response.ok) throw new Error('Erro ao apagar correspondência');
    // DELETE may return empty body; return true on success
    return true;
    } catch (error) {
        console.error(error);
    throw new Error('Erro ao apagar a correspondência');
    }
}

export async function atualizarCorrespondencia(id: number | string, updates: any){
    try {
        const response = await fetch(`http://localhost:8080/api/correspondencias/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Erro ao atualizar correspondência');
        return response.json();
    } catch (error) {
        console.error(error);
        throw new Error('Erro ao atualizar correspondência');
    }
}