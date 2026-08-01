import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Cadastro() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    objetivo: 'ambos'
  });
  
  const [mensagem, setMensagem] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleObjetivoChange = (valor) => {
    setFormData({ ...formData, objetivo: valor });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);

    try {
      const response = await fetch('http://localhost:3000/api/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMensagem({ tipo: 'sucesso', texto: 'Conta criada com sucesso! Bem-vindo ao LendLoop.' });
        setFormData({ nome: '', email: '', senha: '', telefone: '', objetivo: 'ambos' });
      } else {
        setMensagem({ tipo: 'erro', texto: data.erro || 'Erro ao cadastrar.' });
      }
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão. O servidor está rodando?' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-[#FFFFFF] rounded-xl shadow-lg p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#006861]">Criar Conta</h2>
          <p className="text-[#00639E] mt-2">Junte-se à comunidade LendLoop</p>
        </div>

        {mensagem && (
          <div className={`p-4 mb-6 rounded-lg font-medium ${mensagem.tipo === 'sucesso' ? 'bg-[#00B795]/10 text-[#006861] border border-[#00B795]/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Nome Completo</label>
            <input type="text" name="nome" value={formData.nome} onChange={handleChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05BFBE] outline-none text-[#1A1A1A]" placeholder="Ex: João da Silva"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">E-mail</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05BFBE] outline-none text-[#1A1A1A]" placeholder="joao@email.com"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Senha</label>
            <input type="password" name="senha" value={formData.senha} onChange={handleChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05BFBE] outline-none text-[#1A1A1A]" placeholder="••••••••"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Qual seu principal objetivo?</label>
            <div className="space-y-3">
              
              <div 
                onClick={() => handleObjetivoChange('ambos')}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.objetivo === 'ambos' ? 'border-[#00B795] bg-[#00B795]/10 ring-1 ring-[#00B795]' : 'border-gray-300 hover:border-[#05BFBE]'}`}
              >
                <span className={`block text-sm font-semibold ${formData.objetivo === 'ambos' ? 'text-[#006861]' : 'text-[#1A1A1A]'}`}>Ambos</span>
                <span className="block text-xs text-gray-500 mt-0.5">Quero alugar e também disponibilizar meus itens</span>
              </div>

              <div 
                onClick={() => handleObjetivoChange('locatario')}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.objetivo === 'locatario' ? 'border-[#00B795] bg-[#00B795]/10 ring-1 ring-[#00B795]' : 'border-gray-300 hover:border-[#05BFBE]'}`}
              >
                <span className={`block text-sm font-semibold ${formData.objetivo === 'locatario' ? 'text-[#006861]' : 'text-[#1A1A1A]'}`}>Apenas Alugar</span>
                <span className="block text-xs text-gray-500 mt-0.5">Quero procurar itens para pegar emprestado</span>
              </div>

              <div 
                onClick={() => handleObjetivoChange('locador')}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.objetivo === 'locador' ? 'border-[#00B795] bg-[#00B795]/10 ring-1 ring-[#00B795]' : 'border-gray-300 hover:border-[#05BFBE]'}`}
              >
                <span className={`block text-sm font-semibold ${formData.objetivo === 'locador' ? 'text-[#006861]' : 'text-[#1A1A1A]'}`}>Apenas Disponibilizar</span>
                <span className="block text-xs text-gray-500 mt-0.5">Quero colocar meus itens na plataforma para render uma grana</span>
              </div>

            </div>
          </div>

          <button type="submit" className="w-full bg-[#00B795] hover:bg-[#006861] text-[#FFFFFF] font-bold py-3 rounded-lg transition-colors mt-6 shadow-md cursor-pointer">
            Finalizar Cadastro
          </button>

          <p className="text-center text-sm text-[#1A1A1A] mt-6">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-[#00B795] hover:text-[#006861] font-semibold hover:underline transition-colors">
              Faça Login
            </Link>
          </p>

        </form>
        
      </div>
    </div>
  );
}