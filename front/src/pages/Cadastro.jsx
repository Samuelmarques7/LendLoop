import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuEye, LuEyeOff } from 'react-icons/lu';
import {apiRequest } from '../services/api';
import { MedidorForcaSenha } from '../components/MedidorForcaSenha';
import { senhaEhForteOSuficiente } from '../utils/forcaSenha';
import { emailEhValido } from '../utils/validarEmail';

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
  const [erroEmail, setErroEmail] = useState('');
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
    if (e.target.name === 'email' && erroEmail) setErroEmail('');
  };

  const handleBlurEmail = () => {
    if (formData.email && !emailEhValido(formData.email)) {
      setErroEmail('Digite um e-mail válido, ex: joao@email.com');
    } else {
      setErroEmail('');
    }
  };

  const handleObjetivoChange = (valor) => {
    setFormData({ ...formData, objetivo: valor });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);

    if (!emailEhValido(formData.email)) {
      setErroEmail('Digite um e-mail válido, ex: joao@email.com');
      setMensagem({ tipo: 'erro', texto: 'Verifique se o e-mail foi digitado corretamente.' });
      return;
    }

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
      localStorage.setItem('token', data.token);

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
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-verde-escuro">Criar Conta</h2>
          <p className="text-azul-oceano mt-2">Junte-se à comunidade LendLoop</p>
        </div>

        {mensagem && (
          <div className={`p-4 mb-6 rounded-lg font-medium ${mensagem.tipo === 'sucesso' ? 'bg-verde-agua/10 text-verde-escuro border border-verde-agua/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-grafite mb-1">Nome Completo</label>
            <input type="text" name="nome" value={formData.nome} onChange={handleChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ciano outline-none text-grafite" placeholder="Ex: João da Silva"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-grafite mb-1">E-mail</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlurEmail} required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none text-grafite ${erroEmail ? 'border-red-400 focus:ring-red-200' : 'border-gray-300 focus:ring-ciano'}`} placeholder="joao@email.com"/>
            {erroEmail && <p className="text-xs text-red-500 mt-1">{erroEmail}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-grafite mb-1">Senha</label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                required
                minLength={8}
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
            <MedidorForcaSenha senha={formData.senha} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-grafite">CEP</label>
              <a
                href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-azul-oceano hover:text-verde-escuro hover:underline"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ciano outline-none text-grafite"
              placeholder="00000-000"
            />
            {formData.localizacao && (
              <p className="text-xs text-verde-escuro mt-1">📍 {formData.localizacao}</p>
            )}
          </div>


          <div>
            <label className="block text-sm font-medium text-grafite mb-2">Qual seu principal objetivo?</label>
            <div className="space-y-3">
              
              <div 
                onClick={() => handleObjetivoChange('ambos')}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.objetivo === 'ambos' ? 'border-verde-agua bg-verde-agua/10 ring-1 ring-verde-agua' : 'border-gray-300 hover:border-ciano'}`}
              >
                <span className={`block text-sm font-semibold ${formData.objetivo === 'ambos' ? 'text-verde-escuro' : 'text-grafite'}`}>Ambos</span>
                <span className="block text-xs text-gray-500 mt-0.5">Quero alugar e também disponibilizar meus itens</span>
              </div>

              <div 
                onClick={() => handleObjetivoChange('locatario')}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.objetivo === 'locatario' ? 'border-verde-agua bg-verde-agua/10 ring-1 ring-verde-agua' : 'border-gray-300 hover:border-ciano'}`}
              >
                <span className={`block text-sm font-semibold ${formData.objetivo === 'locatario' ? 'text-verde-escuro' : 'text-grafite'}`}>Apenas Alugar</span>
                <span className="block text-xs text-gray-500 mt-0.5">Quero procurar itens para pegar emprestado</span>
              </div>

              <div 
                onClick={() => handleObjetivoChange('locador')}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${formData.objetivo === 'locador' ? 'border-verde-agua bg-verde-agua/10 ring-1 ring-verde-agua' : 'border-gray-300 hover:border-ciano'}`}
              >
                <span className={`block text-sm font-semibold ${formData.objetivo === 'locador' ? 'text-verde-escuro' : 'text-grafite'}`}>Apenas Disponibilizar</span>
                <span className="block text-xs text-gray-500 mt-0.5">Quero colocar meus itens na plataforma para render uma grana</span>
              </div>

            </div>
          </div>

          <button type="submit" className="w-full bg-verde-agua hover:bg-verde-escuro text-white font-bold py-3 rounded-lg transition-colors mt-6 shadow-md cursor-pointer">
            Finalizar Cadastro
          </button>

          <p className="text-center text-sm text-grafite mt-6">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-verde-agua hover:text-verde-escuro font-semibold hover:underline transition-colors">
              Faça Login
            </Link>
          </p>

        </form>
        
      </div>
    </div>
  );
}
