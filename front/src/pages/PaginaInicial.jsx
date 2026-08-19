import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { LuWrench, LuMonitor, LuDumbbell, LuFlower2, LuCar, LuPartyPopper, LuSearch } from 'react-icons/lu';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const categorias = [
  { nome: 'Ferramentas', icone: <LuWrench size={32} /> },
  { nome: 'Eletrônicos', icone: <LuMonitor size={32} /> },
  { nome: 'Esportes', icone: <LuDumbbell size={32} /> },
  { nome: 'Casa & Jardim', icone: <LuFlower2 size={32} /> },
  { nome: 'Transporte', icone: <LuCar size={32} /> },
  { nome: 'Festas', icone: <LuPartyPopper size={32} /> },
];

const passosLocatario = [
  { titulo: 'Buscar e Explorar', descricao: 'Encontre o item perfeito na sua região usando nossos filtros de busca' },
  { titulo: 'Reservar e Pagar', descricao: 'Selecione suas datas e pague com segurança através da nossa plataforma' },
  { titulo: 'Retirar e Aproveitar', descricao: 'Coordene a retirada com o proprietário e aproveite seu aluguel' },
];

const passosAnfitriao = [
  { titulo: 'Anunciar Seus Itens', descricao: 'Faça upload de fotos e detalhes dos itens que você quer alugar' },
  { titulo: 'Aceitar Reservas', descricao: 'Analise e aprove solicitações de aluguel de usuários próximos' },
  { titulo: 'Ganhar Dinheiro', descricao: 'Receba automaticamente quando o período de aluguel terminar' },
];

export function PaginaInicial() {
  const navigate = useNavigate(); 
  const [buscaHome, setBuscaHome] = useState('');

  const isLogado = localStorage.getItem('usuarioLogado') === 'true';

  function handleBuscarHome() {
    if (!buscaHome.trim()) return;

    const params = new URLSearchParams();

    params.append('busca', buscaHome);
    navigate(`/busca?${params.toString()}`);
  }

  return (
    <div className="min-h-screen flex flex-col">

      <Header />

      <section
        className="w-full flex items-center justify-center py-24 px-8"
        style={{ background: 'linear-gradient(135deg, #032D54 0%, #29C354 60%, #0297AA 100%)' }}
      >
        <div className="max-w-2xl w-full flex flex-col items-center text-center gap-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Alugue o que precisa,<br />quando precisa
          </h1>
          <p className="text-white/90 text-lg max-w-md">
            Encontre ferramentas, eletrônicos e muito mais perto de você — sem precisar comprar.
          </p>
          <div className="flex w-full max-w-xl bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 text-[#0068F3]">
              <LuSearch size={20} />
            </div>
            <input
              type="text"
              placeholder="O que você quer alugar?"
              value={buscaHome}
              onChange={(e) => setBuscaHome(e.target.value)}
              onKeyDown={(e) => {if (e.key === 'Enter') handleBuscarHome();}}
              className="flex-1 py-4 text-[#1A1A1A] outline-none text-base"
            />
            <button 
              onClick={handleBuscarHome}
              className="bg-[#29C354] hover:bg-[#032D54] text-white px-6 font-semibold transition-colors cursor-pointer"
            >
              Buscar
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#032D54] mb-3">Categorias Populares</h2>
          <p className="text-center text-[#0068F3] mb-10">
            Encontre o que você precisa nas nossas categorias de aluguel mais populares
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categorias.map((cat) => (
              <div key={cat.nome} className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-full aspect-square bg-gray-50 border border-gray-100 shadow-sm rounded-xl flex items-center justify-center text-[#032D54] group-hover:bg-[#29C354] group-hover:text-white transition-colors">
                  {cat.icone}
                </div>
                <span className="text-sm font-semibold text-[#1A1A1A] mt-1">{cat.nome}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-[#032D54] mb-3">Como Funciona</h2>
          <p className="text-center text-[#0068F3] mb-12">
            Passos simples para alugar ou compartilhar seus itens
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-center text-[#032D54] mb-8">Para Locatários</h3>
              <div className="flex flex-col gap-6">
                {passosLocatario.map((passo, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#29C354] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-[#1A1A1A]">{passo.titulo}</p>
                      <p className="text-[#0068F3] text-sm mt-1 leading-relaxed">{passo.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-center text-[#032D54] mb-8">Para Locadores</h3>
              <div className="flex flex-col gap-6">
                {passosAnfitriao.map((passo, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#29C354] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-[#1A1A1A]">{passo.titulo}</p>
                      <p className="text-[#0068F3] text-sm mt-1 leading-relaxed">{passo.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="bg-[#1A1A1A] py-20 px-8 flex flex-col items-center text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Seja um Locador</h2>
        <p className="text-gray-300 mb-8 max-w-md">
          Transforme seus itens não utilizados em renda. Comece a hospedar hoje.
        </p>
        <button 
          onClick={() => navigate(isLogado ? '/painelLocador' : '/cadastro')} 
          className="bg-[#29C354] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#0297AA] transition-colors cursor-pointer shadow-lg"
        >
          Começar a Hospedar (Grátis e Sem Compromisso)
        </button>
      </section>

      <Footer />

    </div>
  );
}