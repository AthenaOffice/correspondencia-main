//todo: trocar o localhost pela var de ambiente que recebe o dominio

export async function buscarEmpresas(){
    try {
        const response = await fetch('http://localhost:8080/api/empresas/conexa/buscar-todos-registros');
        if (!response.ok) throw new Error('Erro ao buscar empresas');
        
        return response.json();
    } catch (error) {
        console.error(error);
        throw new Error('Erro ao buscar empresas');
    }
}