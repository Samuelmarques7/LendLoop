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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-[#FFFFFF] rounded-xl shadow-lg p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#032D54]">Recuperar Senha</h2>
          <p className="text-[#0068F3] mt-2">Digite seu e-mail cadastrado para receber as instruções.</p>
        </div>

        {mensagem && (
          <div className={`p-4 mb-6 rounded-lg font-medium ${mensagem.tipo === 'sucesso' ? 'bg-[#29C354]/10 text-[#032D54] border border-[#29C354]/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">E-mail</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => { setEmail(e.target.value); if (erroEmail) setErroEmail(''); }} 
              onBlur={handleBlurEmail}
              required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none text-[#1A1A1A] ${erroEmail ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-[#0297AA]'}`} 
              placeholder="joao@email.com"
            />
            {erroEmail && <p className="text-xs text-red-500 mt-1">{erroEmail}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-[#FFFFFF] font-bold py-3 rounded-lg transition-colors mt-6 shadow-md cursor-pointer ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#29C354] hover:bg-[#032D54]'}`}
          >
            {loading ? 'Enviando...' : 'Enviar Instruções'}
          </button>

          <p className="text-center text-sm text-[#1A1A1A] mt-6">
            Lembrou da senha?{' '}
            <Link to="/login" className="text-[#29C354] hover:text-[#032D54] font-semibold hover:underline transition-colors cursor-pointer">
              Voltar para o Login
            </Link>
          </p>
        </form>
        
      </div>
    </div>
  );
}