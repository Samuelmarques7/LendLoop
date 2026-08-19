import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function EsqueceuSenha() {
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);
    
    console.log("Solicitando recuperação para:", email);
    setMensagem({ tipo: 'sucesso', texto: 'Se este e-mail estiver cadastrado, você receberá um link com as instruções de recuperação em breve.' });
    setEmail('');
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
              onChange={(e) => setEmail(e.target.value)} 
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0297AA] outline-none text-[#1A1A1A]" 
              placeholder="joao@email.com"
            />
          </div>

          <button type="submit" className="w-full bg-[#29C354] hover:bg-[#032D54] text-[#FFFFFF] font-bold py-3 rounded-lg transition-colors mt-6 shadow-md cursor-pointer">
            Enviar Instruções
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