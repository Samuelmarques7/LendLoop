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

const parceiros = ['Parceiro 1', 'Parceiro 2', 'Parceiro 3', 'Parceiro 4'];

export function PaginaInicial() {
  const navigate = useNavigate(); 

  return (
    <div className="min-h-screen flex flex-col">

      <Header />

      <section
        className="w-full flex items-center justify-center py-24 px-8"
        style={{ background: 'linear-gradient(135deg, #006861 0%, #00B795 60%, #05BFBE 100%)' }}
      >
        <div className="max-w-2xl w-full flex flex-col items-center text-center gap-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Alugue o que precisa,<br />quando precisa
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Encontre ferramentas, eletrônicos e muito mais perto de você — sem precisar comprar.
          </p>
          <div className="flex w-full max-w-xl bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 text-gray-400">
              <LuSearch size={20} />
            </div>
            <input
              type="text"
              placeholder="O que você quer alugar?"
              className="flex-1 py-4 text-grafite outline-none text-base"
            />
            <button 
              onClick={() => navigate('/busca')} // 👈 CLIQUE PARA BUSCA
              className="bg-verde-escuro hover:bg-grafite text-white px-6 font-semibold transition-colors cursor-pointer"
            >
              Buscar
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-verde-escuro mb-3">Categorias Populares</h2>
          <p className="text-center text-azul-oceano mb-10">
            Encontre o que você precisa nas nossas categorias de aluguel mais populares
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categorias.map((cat) => (
              <div key={cat.nome} className="flex flex-col items-center gap-2 cursor-pointer group">
                <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 group-hover:bg-verde-agua group-hover:text-white transition-colors">
                  {cat.icone}
                </div>
                <span className="text-sm font-medium text-grafite">{cat.nome}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-verde-escuro mb-3">Como Funciona</h2>
          <p className="text-center text-azul-oceano mb-12">
            Passos simples para alugar ou compartilhar seus itens
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

            {/* Para Locatários */}
            <div>
              <h3 className="text-xl font-bold text-center text-grafite mb-8">Para Locatários</h3>
              <div className="flex flex-col gap-6">
                {passosLocatario.map((passo, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-verde-escuro text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-grafite">{passo.titulo}</p>
                      <p className="text-azul-oceano text-sm mt-1">{passo.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-center text-grafite mb-8">Para Anfitriões</h3>
              <div className="flex flex-col gap-6">
                {passosAnfitriao.map((passo, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-verde-escuro text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-grafite">{passo.titulo}</p>
                      <p className="text-azul-oceano text-sm mt-1">{passo.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="bg-grafite py-20 px-8 flex flex-col items-center text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Seja um Anfitrião</h2>
        <p className="text-gray-300 mb-8 max-w-md">
          Transforme seus itens não utilizados em renda. Comece a hospedar hoje.
        </p>
        <button 
          onClick={() => navigate('/painelLocador')} // 👈 CLIQUE PARA O PAINEL
          className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-verde-agua hover:border-verde-agua transition-colors cursor-pointer"
        >
          Começar a Hospedar (Grátis e Sem Compromisso)
        </button>
      </section>
      <section className="py-10 px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm font-semibold text-azul-oceano mb-4">Parceiros de Confiança</p>
          <div className="flex gap-3 flex-wrap">
            {parceiros.map((p) => (
              <div key={p} className="px-6 py-2 bg-gray-100 border border-gray-200 rounded text-grafite text-sm font-medium">
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
}