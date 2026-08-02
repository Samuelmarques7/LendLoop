export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiRequest(caminho, options = {}) {
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    if (config.body && typeof config.body !== 'string') {
        config.body = JSON.stringify(config.body);
    }

    let response;
    try {
        response = await fetch(`${API_URL}${caminho}`, config);
    } catch (erroDeRede){
        throw new Error('Erro de conexão. O servidor está rodando?');
    }

    const data = await response.json().catch(() => null);

    if(!response.ok) {
        throw new Error(data?.erro || 'Erro inesperado no servidor.');
    }

    return data;
}