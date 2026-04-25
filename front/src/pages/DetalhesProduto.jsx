import { 
  LuStar, 
  LuMapPin, 
  LuChevronRight, 
  LuShieldCheck, 
  LuCheck, 
  LuMessageCircle,
  LuCalendar,
  LuClock
} from "react-icons/lu";

export function DetalhesProduto() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans text-[#1A1A1A] flex flex-col">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 w-full shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="text-xl font-bold tracking-widest text-[#1A1A1A] cursor-pointer uppercase">
            PROJETO 
          </div>
          <div className="flex gap-10 items-center text-sm font-medium text-gray-600">
            <button className="hover:text-[#00B795] transition-all cursor-pointer">Entrar </button>
            <button className="bg-[#1A1A1A] text-white px-8 py-3 rounded-lg hover:bg-black transition-all cursor-pointer shadow-md font-bold">
              Cadastrar 
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full flex-grow p-6 pt-8">
        
        {/* BREADCRUMB (Navegação no topo) */}
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
          <span className="cursor-pointer hover:text-[#00B795]">Início</span>
          <LuChevronRight size={14} />
          <span className="cursor-pointer hover:text-[#00B795]">Ferramentas e Equipamentos</span>
          <LuChevronRight size={14} />
          <span className="text-[#1A1A1A]">Kit de Furadeira Profissional</span>
        </div>

        {/* TÍTULO E INFOS BÁSICAS */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-3">Kit de Furadeira Profissional com Brocas</h1>
          <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-1.5 text-[#1A1A1A] font-bold">
              <LuStar className="text-yellow-400" fill="currentColor" size={18}/> 
              4,8 <span className="text-gray-400 font-normal underline cursor-pointer">(24 avaliações)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <LuMapPin className="text-[#00B795]" size={18}/> São Paulo, SP
            </span>
          </div>
        </div>

        {/* GALERIA DE IMAGENS */}
        <div className="grid grid-cols-4 grid-rows-2 gap-4 h-[400px] mb-12 rounded-3xl overflow-hidden">
          <div className="col-span-2 row-span-2 bg-gray-200 relative group cursor-pointer">
            <img src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=800" alt="Principal" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="bg-gray-200 relative group cursor-pointer overflow-hidden"><img src="https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
          <div className="bg-gray-200 relative group cursor-pointer overflow-hidden"><img src="https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
          <div className="bg-gray-200 relative group cursor-pointer overflow-hidden"><img src="https://images.unsplash.com/photo-1530124560676-5f7bc47f271b?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /></div>
          <div className="bg-gray-200 relative group cursor-pointer overflow-hidden">
            <img src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-lg hover:bg-black/50 transition-colors">+3 mais</div>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL DIVIDIDO EM 2 COLUNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
          
          {/* COLUNA ESQUERDA (Detalhes do Produto) */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Descrição */}
            <section>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">Descrição</h2>
              <p className="text-gray-500 leading-relaxed text-sm">
                Este kit de furadeira de nível profissional inclui tudo o que você precisa para seus projetos de melhoria residencial. Possui uma furadeira sem fio de 18V com múltiplas configurações de velocidade, um conjunto abrangente de brocas e uma maleta resistente.
                <br/><br/>
                Perfeita para furar madeira, metal e alvenaria. A bateria oferece até 4 horas de uso contínuo e carrega rapidamente. Todas as ferramentas são bem mantidas e higienizadas entre os aluguéis.
              </p>
            </section>

            {/* O que está incluído */}
            <section>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-4">O que está incluído</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm text-gray-600 font-medium">
                <div className="flex items-center gap-3"><LuCheck className="text-[#00B795]" size={20}/> Furadeira sem fio 18V</div>
                <div className="flex items-center gap-3"><LuCheck className="text-[#00B795]" size={20}/> Kit com 20 brocas</div>
                <div className="flex items-center gap-3"><LuCheck className="text-[#00B795]" size={20}/> 2 baterias recarregáveis</div>
                <div className="flex items-center gap-3"><LuCheck className="text-[#00B795]" size={20}/> Maleta de transporte</div>
                <div className="flex items-center gap-3"><LuCheck className="text-[#00B795]" size={20}/> Carregador de bateria</div>
                <div className="flex items-center gap-3"><LuCheck className="text-[#00B795]" size={20}/> Manual do usuário</div>
              </div>
            </section>

            {/* Diretrizes */}
            <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">Diretrizes de Aluguel</h2>
              <ul className="space-y-3 text-sm text-gray-600 font-medium">
                <li className="flex items-start gap-2"><span>📍</span> Retirada e devolução na minha localização em São Paulo</li>
                <li className="flex items-start gap-2"><span>💰</span> Depósito caução de R$ 150 necessário</li>
                <li className="flex items-start gap-2"><span>✨</span> Favor devolver limpo e nas mesmas condições</li>
                <li className="flex items-start gap-2"><span>🕒</span> Disponível para retirada das 9h às 19h</li>
              </ul>
            </section>

            {/* Anfitrião */}
            <section className="border-t border-gray-200 pt-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#00B795] rounded-full flex items-center justify-center text-white text-2xl font-bold">C</div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1A1A]">Carlos Silva</h2>
                    <p className="text-sm text-gray-500">Membro desde março de 2023</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 border border-[#1A1A1A] text-[#1A1A1A] px-6 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm">
                  <LuMessageCircle size={18}/> Mensagem ao Anfitrião
                </button>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Sou empreiteiro com mais de 10 anos de experiência. Adoro compartilhar minhas ferramentas com a comunidade e ajudar outros a completarem seus projetos. Todos os meus equipamentos são de nível profissional e bem mantidos.
              </p>
              <div className="flex gap-8 text-sm font-bold text-[#1A1A1A]">
                <div><span className="text-[#00B795]">23</span> ferramentas listadas</div>
                <div>Normalmente responde em <span className="text-[#00B795]">1 hora</span></div>
              </div>
            </section>

          </div>

          {/* COLUNA DIREITA (Sidebar Card de Reserva) */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 bg-white border border-gray-100 rounded-3xl p-6 shadow-xl">
              
              <div className="flex items-end justify-between mb-6 border-b border-gray-100 pb-6">
                <div>
                  <span className="text-3xl font-black text-[#1A1A1A]">R$ 45</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">/ dia</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                  <LuStar className="text-yellow-400" fill="currentColor" size={14}/> 4,8 (24 avaliações)
                </div>
              </div>

              {/* Inputs de Data e Hora */}
              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-gray-200 rounded-xl p-3 relative">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Data de Início</label>
                    <input type="date" className="w-full text-sm font-bold outline-none bg-transparent cursor-pointer" />
                  </div>
                  <div className="border border-gray-200 rounded-xl p-3 relative">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Data de Término</label>
                    <input type="date" className="w-full text-sm font-bold outline-none bg-transparent cursor-pointer" />
                  </div>
                </div>
                <div className="border border-gray-200 rounded-xl p-3 relative">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Horário de Retirada</label>
                  <input type="time" defaultValue="09:00" className="w-full text-sm font-bold outline-none bg-transparent cursor-pointer" />
                </div>
              </div>

              {/* Cálculos */}
              <div className="space-y-4 text-sm font-medium text-gray-600 mb-6">
                <div className="flex justify-between">
                  <span>R$ 45 x 3 dias</span>
                  <span className="text-[#1A1A1A] font-bold">R$ 135.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Serviço</span>
                  <span className="text-[#1A1A1A] font-bold">R$ 4.50</span>
                </div>
                <div className="flex justify-between">
                  <span className="underline cursor-pointer">Depósito de Segurança</span>
                  <span className="text-[#1A1A1A] font-bold">R$ 150.00</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-between items-center mb-6">
                <span className="font-bold text-[#1A1A1A]">Total</span>
                <span className="text-xl font-black text-[#1A1A1A]">R$ 289.50</span>
              </div>

              <button className="w-full bg-[#1A1A1A] text-white font-black py-4 rounded-xl hover:bg-black transition-all uppercase tracking-widest cursor-pointer shadow-lg active:scale-95 mb-3">
                Solicitar Aluguel
              </button>

              <div className="text-center space-y-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Você ainda não será cobrado</p>
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#00B795]">
                  <LuShieldCheck size={16}/> Protegido por PROJETO Pagamentos Seguros
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-100 w-full py-12 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-xl font-black tracking-tighter text-[#1A1A1A]">PROJETO</div>
          <div className="flex gap-10 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            <span className="hover:text-[#00B795] cursor-pointer">Sobre Nós</span>
            <span className="hover:text-[#00B795] cursor-pointer">FAQ</span>
            <span className="hover:text-[#00B795] cursor-pointer">Termos</span>
            <span className="hover:text-[#00B795] cursor-pointer">Contato</span>
          </div>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
            © 2026 PROJETO. TODOS OS DIREITOS RESERVADOS.
          </p>
        </div>
      </footer>
    </div>
  );
}