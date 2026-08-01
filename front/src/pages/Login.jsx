import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [credentials, setCredentials] = useState({
    email: '',
    senha: ''
  });
  
  const [mensagem, setMensagem] = useState(null);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);
    
    console.log("Tentando logar com:", credentials);
    setMensagem({ tipo: 'info', texto: 'A integração de Login com o back-end será feita em breve!' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-[#FFFFFF] rounded-xl shadow-lg p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#006861]">Bem-vindo de volta!</h2>
          <p className="text-[#00639E] mt-2">Acesse sua conta no LendLoop</p>
        </div>

        {mensagem && (
          <div className="p-4 mb-6 rounded-lg font-medium bg-blue-50 text-[#00639E] border border-blue-200">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05BFBE] outline-none text-[#1A1A1A]" 
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05BFBE] outline-none text-[#1A1A1A]" 
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end">
            <Link to="/esqueceu-senha" className="text-sm text-[#00B795] hover:text-[#006861] hover:underline transition-colors cursor-pointer">Esqueceu a senha?</Link>
          </div>

          <button type="submit" className="w-full bg-[#00B795] hover:bg-[#006861] text-[#FFFFFF] font-bold py-3 rounded-lg transition-colors mt-6 shadow-md cursor-pointer">
            Entrar
          </button>

          <p className="text-center text-sm text-[#1A1A1A] mt-6">
            Ainda não tem uma conta?{' '}
            <Link to="/cadastro" className="text-[#00B795] hover:text-[#006861] font-semibold hover:underline transition-colors cursor-pointer">
              Cadastre-se
            </Link>
          </p>
        </form>
        
      </div>
    </div>
  );
}