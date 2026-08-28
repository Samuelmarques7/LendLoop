export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiRequest(caminho, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem('dadosUsuario');
        window.location.href = '/login';
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    const data = await response.json().catch(() => null);

    if(!response.ok) {
        const erro = new Error(data?.erro || 'Erro inesperado no servidor.');
        erro.data = data; // permite checar flags como `verificacaoNecessaria` sem parsear a mensagem
        throw erro;
    }

    return data;
}