//todo: trocar o localhost pela var de ambiente que recebe o dominio

export async function buscarCorrespondencias(){
    try {
        const response = await fetch('http://localhost:8080/api/correspondencias/listar-correspondencia');
        if (!response.ok) throw new Error('Erro ao buscar empresas');
        
        return response.json();
    } catch (error) {
        console.error(error);
        throw new Error('Erro ao buscar empresas');
    }
}
export async function salvarCorrespondencia(correspondencia: any){
    try {
        const response = await fetch('http://localhost:8080/api/correspondencias', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(correspondencia),
        });
        if (!response.ok) throw new Error('Erro ao buscar empresas');
        
        return response.json();
    } catch (error) {
        console.error(error);
        throw new Error('Erro ao buscar empresas');
    }
}

export async function apagarCorrespondencia(id: string){
    try {
        const response = await fetch(`http://localhost:8080/api/correspondencias/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Erro ao apagar correspondência');
        
        return response.json();
    } catch (error) {
        console.error(error);
        throw new Error('Erro ao apagar a correspondência');
    }
}