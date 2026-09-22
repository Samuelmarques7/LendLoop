import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { MedidorForcaSenha } from '../components/MedidorForcaSenha';
import { senhaEhForteOSuficiente } from '../utils/forcaSenha';

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagem, setMensagem] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);

    if (!token) {
      setMensagem({ tipo: 'erro', texto: 'Link inválido. Solicite a recuperação novamente.' });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMensagem({ tipo: 'erro', texto: 'As senhas não coincidem.' });
      return;
    }

    if (!senhaEhForteOSuficiente(novaSenha)) {
      setMensagem({
        tipo: 'erro',
        texto: 'Sua senha precisa ter pelo menos 8 caracteres e nível "Média" ou "Forte". Combine letras maiúsculas, números e símbolos.'
      });
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest('/api/redefinir-senha', {
        method: 'POST',
        body: { token, novaSenha }
      });

      setMensagem({ tipo: 'sucesso', texto: data.mensagem + ' Redirecionando para o login...' });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100 text-center">
          <h2 className="text-2xl font-bold text-verde-escuro mb-4">Link inválido</h2>
          <p className="text-grafite mb-6">Este link de recuperação é inválido ou está incompleto.</p>
          <Link to="/esqueceu-senha" className="text-verde-agua hover:text-verde-escuro font-semibold hover:underline transition-colors cursor-pointer">
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-verde-escuro">Nova Senha</h2>
          <p className="text-azul-oceano mt-2">Escolha uma nova senha para sua conta.</p>
        </div>

        {mensagem && (
          <div className={`p-4 mb-6 rounded-lg font-medium ${mensagem.tipo === 'sucesso' ? 'bg-verde-agua/10 text-verde-escuro border border-verde-agua/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-grafite mb-1">Nova senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ciano outline-none text-grafite"
              placeholder="••••••••"
            />
            <MedidorForcaSenha senha={novaSenha} />
          </div>

          <div>
            <label className="block text-sm font-medium text-grafite mb-1">Confirmar nova senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ciano outline-none text-grafite"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold py-3 rounded-lg transition-colors mt-6 shadow-md cursor-pointer ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-verde-agua hover:bg-verde-escuro'}`}
          >
            {loading ? 'Salvando...' : 'Redefinir Senha'}
          </button>

          <p className="text-center text-sm text-grafite mt-6">
            Lembrou da senha?{' '}
            <Link to="/login" className="text-verde-agua hover:text-verde-escuro font-semibold hover:underline transition-colors cursor-pointer">
              Voltar para o Login
            </Link>
          </p>
        </form>

      </div>
    </div>
  );
}