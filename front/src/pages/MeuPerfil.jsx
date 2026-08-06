import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, apiRequest } from '../services/api';
import { 
  LuCamera, 
  LuMapPin, 
  LuStar, 
  LuSettings, 
  LuShieldCheck, 
  LuShoppingBag,
  LuPackage,
  LuCalendarDays,
  LuCheck 
} from 'react-icons/lu';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

function formatarMembroDesde(dataCriacao) {
  const data = new Date(dataCriacao);
  const anoAtual = new Date().getFullYear();
  const anoCadastro = data.getFullYear();

  if (anoCadastro === anoAtual) {
    return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  return String(anoCadastro);
}

export default function MeuPerfil() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [usuario, setUsuario] = useState({
    nome: 'Carregando...',
    email: '',
    avatar: 'https://ui-avatars.com/api/?name=U&background=00B795&color=fff&size=150',
    localizacao: 'Santa Rita do Sapucaí, MG',
    bio: 'Estudante de Engenharia de Computação. Gosto de testar novos hardwares e ferramentas para meus projetos. Compartilhando o que não uso com a comunidade!',
    membroDesde: 'Janeiro de 2026'
  });

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('dadosUsuario');
    if (dadosSalvos) {
      const dados = JSON.parse(dadosSalvos);
      setUsuario(prev => ({
        ...prev,
        nome: dados.nome,
        email: dados.email,
        avatar: dados.avatar || `https://ui-avatars.com/api/?name=${dados.nome.replace(' ', '+')}&background=00B795&color=fff&size=150`,
        localizacao: dados.localizacao || 'Localização não informada',
        membroDesde: formatarMembroDesde(dados.createdAt)
      }));
    }
  }, []);

  const [avaliacoes] = useState([
    { id: 1, autor: 'Marcos Castro', data: 'Fevereiro de 2026', nota: 5, texto: 'Excelente locador! O equipamento estava em perfeitas condições e a comunicação foi muito rápida e clara. Recomendo muito.' },
    { id: 2, autor: 'Sarah Wilson', data: 'Janeiro de 2026', nota: 5, texto: 'Peguei uma furadeira emprestada e salvou meu fim de semana. Muito gente boa na hora de combinar a entrega.' }
  ]);

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('fotos', file);

      const respostaUpload = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      const dadosUpload = await respostaUpload.json();

      if (!respostaUpload.ok) {
        throw new Error(dadosUpload.erro || 'Erro ao enviar foto');
      }

      const novaUrlAvatar = dadosUpload.urls[0];

      const dadosSalvos = JSON.parse(localStorage.getItem('dadosUsuario'));

      const resultado = await apiRequest(`/api/usuarios/${dadosSalvos.id}`, {
        method: 'PATCH',
        body: { avatar: novaUrlAvatar }
      });

      setUsuario(prev => ({ ...prev, avatar: resultado.usuario.avatar }));

      localStorage.setItem('dadosUsuario', JSON.stringify({
        ...dadosSalvos,
        avatar: resultado.usuario.avatar
      }));

    } catch (erro) {
      console.error('Erro ao atualizar avatar:', erro);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans flex flex-col text-[#1A1A1A]">
      <Header />

      <main className="flex-grow w-full pb-16">
        <section className="w-full">
          <div className="h-64 w-full bg-gradient-to-r from-[#006861] via-[#00B795] to-[#05BFBE] relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]"></div>
          </div>
          
          <div className="max-w-5xl mx-auto px-6 sm:px-8 relative -mt-20 flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-40 h-40 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden relative">
                <img src={usuario.avatar} alt="Avatar" className="w-full h-full object-cover" />
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-sm">
                  <LuCamera size={32} />
                  <span className="text-xs font-bold mt-2 uppercase tracking-widest">Alterar</span>
                </div>
              </div>
              
              <div className="absolute bottom-2 right-2 w-10 h-10 bg-[#00B795] border-4 border-white rounded-full flex items-center justify-center text-white shadow-sm" title="Conta Verificada">
                <LuShieldCheck size={18} />
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <div className="text-center sm:text-left flex-grow pb-2">
              <h1 className="text-3xl font-black text-[#1A1A1A]">{usuario.nome}</h1>
              <p className="text-[#00639E] font-semibold mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <LuMapPin size={16} /> {usuario.localizacao}
              </p>
            </div>

            <div className="pb-2">
              <button className="flex items-center gap-2 bg-white border border-gray-200 text-[#1A1A1A] font-bold px-6 py-2.5 rounded-xl hover:border-[#00B795] hover:text-[#00B795] transition-colors shadow-sm cursor-pointer">
                {/* Usando LuSettings aqui */}
                <LuSettings size={16} /> Editar Perfil
              </button>
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-6 sm:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 mt-12">
          
          <div className="md:col-span-4 space-y-8">
            
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Alternar Painel</h2>
              
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/painelLocatario')}
                  className="w-full flex items-center p-4 rounded-2xl border-2 border-transparent hover:border-[#00B795] bg-gray-50 hover:bg-[#00B795]/5 transition-all text-left group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#00639E] flex items-center justify-center shrink-0 mr-4 group-hover:bg-[#00B795] group-hover:text-white transition-colors">
                    <LuShoppingBag size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A]">Modo Locatário</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Gerenciar meus aluguéis</p>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/painelLocador')}
                  className="w-full flex items-center p-4 rounded-2xl border-2 border-transparent hover:border-[#00B795] bg-gray-50 hover:bg-[#00B795]/5 transition-all text-left group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center shrink-0 mr-4 group-hover:bg-[#00B795] group-hover:text-white transition-colors">
                    <LuPackage size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A]">Modo Locador</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Meus anúncios e ganhos</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Informações da Conta</h2>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-[#1A1A1A] font-medium">
                  <LuCheck className="text-[#00B795] bg-[#00B795]/10 p-1 rounded-full" size={24} /> Identidade verificada
                </li>
                <li className="flex items-center gap-3 text-sm text-[#1A1A1A] font-medium">
                  <LuCheck className="text-[#00B795] bg-[#00B795]/10 p-1 rounded-full" size={24} /> E-mail confirmado
                </li>
                <li className="flex items-center gap-3 text-sm text-[#1A1A1A] font-medium">
                  <LuCheck className="text-[#00B795] bg-[#00B795]/10 p-1 rounded-full" size={24} /> Telefone confirmado
                </li>
              </ul>
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-500 font-medium">
                <LuCalendarDays size={18} /> Membro desde {usuario.membroDesde}
              </div>
            </div>
          </div>

          <div className="md:col-span-8 space-y-8">
            
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Sobre mim</h2>
              <p className="text-gray-600 leading-relaxed">
                {usuario.bio}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <LuStar className="text-yellow-400" size={28} fill="currentColor" />
                <h2 className="text-2xl font-black text-[#1A1A1A]">5,0</h2>
                <span className="text-gray-400 font-medium mt-1">({avaliacoes.length} avaliações)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {avaliacoes.map((review) => (
                  <div key={review.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow cursor-default">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center overflow-hidden">
                        <img src={`https://ui-avatars.com/api/?name=${review.autor.replace(' ', '+')}&background=random`} alt={review.autor} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-[#1A1A1A] text-sm">{review.autor}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{review.data}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed italic">
                      "{review.texto}"
                    </p>
                  </div>
                ))}
              </div>

              <button className="mt-8 border-2 border-[#1A1A1A] text-[#1A1A1A] font-bold px-6 py-2.5 rounded-xl hover:bg-[#1A1A1A] hover:text-white transition-colors cursor-pointer">
                Mostrar todas as avaliações
              </button>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}