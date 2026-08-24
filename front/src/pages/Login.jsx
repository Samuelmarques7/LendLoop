import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {apiRequest } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    senha: ''
  });
  
  const [mensagem, setMensagem] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);
    setLoading(true);

    try {
      const data = await apiRequest('/api/login', {
        method: 'POST',
        body: credentials
      });

      localStorage.setItem('usuarioLogado', 'true');
      localStorage.setItem('dadosUsuario', JSON.stringify(data.usuario));
      localStorage.setItem('token', data.token);

      setMensagem({ tipo: 'sucesso', texto: 'Bem-vindo de volta! Redirecionando...' });

      setTimeout(() => {
        navigate('/');
      }, 1000);
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
          <h2 className="text-3xl font-bold text-[#032D54]">Bem-vindo de volta!</h2>
          <p className="text-[#0068F3] mt-2">Acesse sua conta no LendLoop</p>
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
              name="email" 
              value={credentials.email} 
              onChange={handleChange} 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0297AA] outline-none text-[#1A1A1A]" 
              placeholder="joao@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Senha</label>
            <input 
              type="password" 
              name="senha" 
              value={credentials.senha} 
              onChange={handleChange} 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0297AA] outline-none text-[#1A1A1A]" 
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end">
            <Link to="/esqueceu-senha" className="text-sm text-[#29C354] hover:text-[#032D54] hover:underline transition-colors cursor-pointer">
              Esqueceu a senha?
            </Link>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-[#FFFFFF] font-bold py-3 rounded-lg transition-colors mt-6 shadow-md cursor-pointer ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#29C354] hover:bg-[#032D54]'}`}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="text-center text-sm text-[#1A1A1A] mt-6">
            Ainda não tem uma conta?{' '}
            <Link to="/cadastro" className="text-[#29C354] hover:text-[#032D54] font-semibold hover:underline transition-colors cursor-pointer">
              Cadastre-se
            </Link>
          </p>
        </form>
        
      </div>
    </div>
  );
}