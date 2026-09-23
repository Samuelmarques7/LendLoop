import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import {apiRequest } from '../services/api';
import { emailEhValido } from '../utils/validarEmail';

export default function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    senha: ''
  });
  
  const [mensagem, setMensagem] = useState(null);
  const [erroEmail, setErroEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (e.target.name === 'email' && erroEmail) setErroEmail('');
  };

  const handleBlurEmail = () => {
    if (credentials.email && !emailEhValido(credentials.email)) {
      setErroEmail('Digite um e-mail válido, ex: joao@email.com');
    } else {
      setErroEmail('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);

    if (!emailEhValido(credentials.email)) {
      setErroEmail('Digite um e-mail válido, ex: joao@email.com');
      return;
    }

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
        navigate(data.usuario.papel === 'admin' ? '/paineladmin' : '/');
      }, 1000);
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
          <h2 className="text-3xl font-bold text-verde-escuro">Bem-vindo de volta!</h2>
          <p className="text-azul-oceano mt-2">Acesse sua conta no LendLoop</p>
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
              name="email" 
              value={credentials.email} 
              onChange={handleChange} 
              onBlur={handleBlurEmail}
              required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none text-grafite ${erroEmail ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-ciano'}`} 
              placeholder="joao@email.com"
            />
            {erroEmail && <p className="text-xs text-red-500 mt-1">{erroEmail}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-grafite mb-1">Senha</label>
            <div className="relative">
              <input 
                type={mostrarSenha ? 'text' : 'password'} 
                name="senha" 
                value={credentials.senha} 
                onChange={handleChange} 
                required
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ciano outline-none text-grafite" 
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                tabIndex={-1}
                title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-azul-oceano transition-colors cursor-pointer"
              >
                {mostrarSenha ? <LuEyeOff size={18} /> : <LuEye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/esqueceu-senha" className="text-sm text-verde-agua hover:text-verde-escuro hover:underline transition-colors cursor-pointer">
              Esqueceu a senha?
            </Link>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white font-bold py-3 rounded-lg transition-colors mt-6 shadow-md cursor-pointer ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-verde-agua hover:bg-verde-escuro'}`}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="text-center text-sm text-grafite mt-6">
            Ainda não tem uma conta?{' '}
            <Link to="/cadastro" className="text-verde-agua hover:text-verde-escuro font-semibold hover:underline transition-colors cursor-pointer">
              Cadastre-se
            </Link>
          </p>
        </form>
        
      </div>
    </div>
  );
}
