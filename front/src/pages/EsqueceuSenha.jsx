import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { emailEhValido } from '../utils/validarEmail';

export default function EsqueceuSenha() {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState(null);
  const [erroEmail, setErroEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBlurEmail = () => {
    if (email && !emailEhValido(email)) {
      setErroEmail('Digite um e-mail válido, ex: joao@email.com');
    } else {
      setErroEmail('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);

    if (!emailEhValido(email)) {
      setErroEmail('Digite um e-mail válido, ex: joao@email.com');
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest('/api/esqueceu-senha', {
        method: 'POST',
        body: { email }
      });

      setMensagem({ tipo: 'sucesso', texto: data.mensagem });
      setEmail('');
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-3xl border border-gray-100 bg-white p-7 shadow-xl shadow-verde-escuro/5 sm:p-8">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-verde-escuro">Recuperar Senha</h2>
          <p className="text-azul-oceano mt-2">Digite seu e-mail cadastrado para receber as instruções.</p>
        </div>

        {mensagem && (
          <div className={`p-4 mb-6 rounded-lg font-medium ${mensagem.tipo === 'sucesso' ? 'bg-verde-agua/10 text-verde-escuro border border-verde-agua/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-grafite mb-1">E-mail</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => { setEmail(e.target.value); if (erroEmail) setErroEmail(''); }} 
              onBlur={handleBlurEmail}
              required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none text-grafite ${erroEmail ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-ciano'}`} 
              placeholder="joao@email.com"
            />
            {erroEmail && <p className="text-xs text-red-500 mt-1">{erroEmail}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white font-bold py-3 rounded-lg transition-colors mt-6 shadow-md cursor-pointer ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-verde-agua hover:bg-verde-escuro'}`}
          >
            {loading ? 'Enviando...' : 'Enviar Instruções'}
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
