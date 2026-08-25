import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import {apiRequest } from '../services/api';
import { MedidorForcaSenha } from '../components/MedidorForcaSenha';
import { senhaEhForteOSuficiente } from '../utils/forcaSenha';

export default function Cadastro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    cep: '',
    localizacao: '',
    objetivo: 'ambos'
  });
  
  const [mensagem, setMensagem] = useState(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleCepChange = (e) => {
    const cepDigitado = e.target.value;
    setFormData(prev => ({ ...prev, cep: cepDigitado }));

    const cepLimpo = cepDigitado.replace(/\D/g, '');

    if (cepLimpo.length === 8) {
      fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`)
        .then(resposta => resposta.json())
        .then(dados => {
          setFormData(prev => ({ ...prev, localizacao: `${dados.city}, ${dados.state}` }));
        })
        .catch(() => {
          setMensagem({ tipo: 'erro', texto: 'CEP não encontrado. Verifique e tente novamente.' });
        });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleObjetivoChange = (valor) => {
    setFormData({ ...formData, objetivo: valor });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);

    if (!senhaEhForteOSuficiente(formData.senha)) {
      setMensagem({
        tipo: 'erro',
        texto: 'Sua senha precisa ter pelo menos 8 caracteres e nível "Média" ou "Forte". Combine letras maiúsculas, números e símbolos.'
      });
      return;
    }

    try {
      const data = await apiRequest('/api/usuarios', {
              method: 'POST',
              body: formData
            });

      localStorage.setItem('usuarioLogado', 'true');
      localStorage.setItem('dadosUsuario', JSON.stringify(data.usuario));

      setMensagem({ tipo: 'sucesso', texto: 'Conta criada com sucesso! Redirecionando...' });
      setFormData({ nome: '', email: '', senha: '', telefone: '',cep: '', localizacao: '', objetivo: 'ambos' });
        
      setTimeout(() => {
        navigate(-1);
      }, 1000);
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: error.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-[#FFFFFF] rounded-xl shadow-lg p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#032D54]">Criar Conta</h2>
          <p className="text-[#0068F3] mt-2">Junte-se à comunidade LendLoop</p>
        </div>

        {mensagem && (
          <div className={`p-4 mb-6 rounded-lg font-medium ${mensagem.tipo === 'sucesso' ? 'bg-[#29C354]/10 text-[#032D54] border border-[#29C354]/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Nome Completo</label>
            <input type="text" name="nome" value={formData.nome} onChange={handleChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0297AA] outline-none text-[#1A1A1A]" placeholder="Ex: João da Silva"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">E-mail</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0297AA] outline-none text-[#1A1A1A]" placeholder="joao@email.com"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Senha</label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0297AA] outline-none text-[#1A1A1A]"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                tabIndex={-1}
                title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0068F3] transition-colors cursor-pointer"
              >
                {mostrarSenha ? <LuEyeOff size={18} /> : <LuEye size={18} />}
              </button>
            </div>
            <MedidorForcaSenha senha={formData.senha} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-[#1A1A1A]">CEP</label>
              <a
                href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#00639E] hover:text-[#006861] hover:underline"
              >
                Não sei meu CEP
              </a>
            </div>
            <input
              type="text"
              name="cep"
              value={formData.cep}
              onChange={handleCepChange}
              maxLength={9}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#05BFBE] outline-none text-[#1A1A1A]"
              placeholder="00000-000"
            />
            {formData.localizacao && (
              <p className="text-xs text-[#006861] mt-1">📍 {formData.localizacao}</p>
            )}
          </div>


          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Qual seu principal objetivo?</label>
            <div className="space-y-3">
              
              <div 
                onClick={() => handleObjetivoChange('ambos')}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.objetivo === 'ambos' ? 'border-[#29C354] bg-[#29C354]/10 ring-1 ring-[#29C354]' : 'border-gray-300 hover:border-[#0297AA]'}`}
              >
                <span className={`block text-sm font-semibold ${formData.objetivo === 'ambos' ? 'text-[#032D54]' : 'text-[#1A1A1A]'}`}>Ambos</span>
                <span className="block text-xs text-gray-500 mt-0.5">Quero alugar e também disponibilizar meus itens</span>
              </div>

              <div 
                onClick={() => handleObjetivoChange('locatario')}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.objetivo === 'locatario' ? 'border-[#29C354] bg-[#29C354]/10 ring-1 ring-[#29C354]' : 'border-gray-300 hover:border-[#0297AA]'}`}
              >
                <span className={`block text-sm font-semibold ${formData.objetivo === 'locatario' ? 'text-[#032D54]' : 'text-[#1A1A1A]'}`}>Apenas Alugar</span>
                <span className="block text-xs text-gray-500 mt-0.5">Quero procurar itens para pegar emprestado</span>
              </div>

              <div 
                onClick={() => handleObjetivoChange('locador')}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.objetivo === 'locador' ? 'border-[#29C354] bg-[#29C354]/10 ring-1 ring-[#29C354]' : 'border-gray-300 hover:border-[#0297AA]'}`}
              >
                <span className={`block text-sm font-semibold ${formData.objetivo === 'locador' ? 'text-[#032D54]' : 'text-[#1A1A1A]'}`}>Apenas Disponibilizar</span>
                <span className="block text-xs text-gray-500 mt-0.5">Quero colocar meus itens na plataforma para render uma grana</span>
              </div>

            </div>
          </div>

          <button type="submit" className="w-full bg-[#29C354] hover:bg-[#032D54] text-[#FFFFFF] font-bold py-3 rounded-lg transition-colors mt-6 shadow-md cursor-pointer">
            Finalizar Cadastro
          </button>

          <p className="text-center text-sm text-[#1A1A1A] mt-6">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-[#29C354] hover:text-[#032D54] font-semibold hover:underline transition-colors">
              Faça Login
            </Link>
          </p>

        </form>
        
      </div>
    </div>
  );
}