import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuArrowRight, LuCheck, LuChevronDown, LuCircleHelp, LuMail, LuShieldCheck, LuUsers } from 'react-icons/lu';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

function PaginaInstitucional({ etiqueta, titulo, descricao, children }) {
  return (
    <div className="page-shell flex min-h-screen flex-col text-grafite">
      <Header />
      <main className="flex-1">
        <section className="border-b border-verde-agua/25 bg-[#effaf3] px-6 py-14 sm:px-8 lg:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="border-l-4 border-verde-agua pl-5 sm:pl-7">
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-verde-agua">{etiqueta}</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-verde-escuro sm:text-5xl">{titulo}</h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">{descricao}</p>
            </div>
          </div>
        </section>
          <section className="bg-white px-6 py-12 sm:px-8 lg:py-16"><div className="mx-auto max-w-5xl">{children}</div></section>
      </main>
      <Footer />
    </div>
  );
}

export function SobreNos() {
  return <PaginaInstitucional etiqueta="Sobre a LendLoop" titulo="Acesso ao que você precisa. Sem acúmulo." descricao="A LendLoop é um MVP brasileiro para aproximar pessoas que têm itens parados de quem precisa deles por um período curto.">
    <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr]">
      <div><h2 className="text-2xl font-black text-verde-escuro">Uma forma mais leve de usar as coisas</h2><p className="mt-4 leading-relaxed text-gray-600">Uma furadeira pode ajudar em uma reforma de fim de semana. Uma câmera pode registrar uma viagem. Nem tudo precisa virar compra — e nem todo item precisa ficar parado.</p><p className="mt-4 leading-relaxed text-gray-600">Criamos a LendLoop para tornar o aluguel entre pessoas mais simples de descobrir, combinar e acompanhar. Nesta fase inicial, evoluímos a plataforma junto da comunidade.</p><Link to="/busca" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-verde-agua px-5 py-3 text-sm font-bold text-white hover:bg-ciano">Explorar itens <LuArrowRight size={17} /></Link></div>
      <aside className="rounded-3xl border border-ciano/20 bg-ciano/5 p-7"><LuUsers size={27} className="text-ciano" /><h2 className="mt-4 text-xl font-black text-verde-escuro">Como funciona hoje</h2><ul className="mt-5 space-y-4 text-sm leading-relaxed text-gray-600"><li className="flex gap-3"><LuCheck className="mt-0.5 shrink-0 text-verde-agua" size={18} /> Pessoas anunciam itens e períodos disponíveis.</li><li className="flex gap-3"><LuCheck className="mt-0.5 shrink-0 text-verde-agua" size={18} /> Interessados enviam uma solicitação de aluguel.</li><li className="flex gap-3"><LuCheck className="mt-0.5 shrink-0 text-verde-agua" size={18} /> O acompanhamento fica registrado nos painéis da plataforma.</li></ul></aside>
    </div>
  </PaginaInstitucional>;
}

const perguntas = [
  ['Como faço para alugar um item?', 'Busque pelo item, confira os dias disponíveis e envie uma solicitação. O proprietário analisa o pedido antes de confirmar a reserva.'],
  ['O pagamento já é real?', 'Ainda não. Nesta versão de MVP, as etapas de pagamento são simuladas para validar a experiência de reserva. Nenhuma cobrança é processada pela LendLoop nesta fase.'],
  ['Por que preciso verificar minha identidade?', 'A verificação ajuda a criar uma comunidade mais confiável. Os documentos são enviados para análise da equipe administrativa antes da liberação para anunciar ou solicitar aluguéis.'],
  ['Posso cancelar uma solicitação?', 'Sim. Enquanto a solicitação estiver pendente, ela pode ser cancelada no painel. Para reservas já aceitas, combine a situação com a outra pessoa pelo canal da plataforma.'],
  ['O que acontece se houver um problema com o item?', 'Registre a conversa e os detalhes no histórico da reserva. Em breve, o MVP terá um fluxo dedicado para suporte e mediação de ocorrências.'],
];

export function FAQ() {
  const [aberta, setAberta] = useState(0);
  return <PaginaInstitucional etiqueta="Central de ajuda" titulo="Dúvidas frequentes" descricao="Respostas diretas sobre o funcionamento atual da LendLoop durante a fase de MVP.">
    <div className="mx-auto max-w-3xl space-y-3">{perguntas.map(([pergunta, resposta], indice) => <article key={pergunta} className="overflow-hidden rounded-2xl border border-gray-100"><button onClick={() => setAberta(aberta === indice ? -1 : indice)} className="flex w-full items-center justify-between gap-5 px-6 py-5 text-left font-bold text-verde-escuro hover:bg-gray-50">{pergunta}<LuChevronDown className={`shrink-0 transition-transform ${aberta === indice ? 'rotate-180' : ''}`} size={20} /></button>{aberta === indice && <p className="border-t border-gray-100 px-6 py-5 text-sm leading-relaxed text-gray-600">{resposta}</p>}</article>)}</div>
    <div className="mx-auto mt-10 flex max-w-3xl items-center gap-4 rounded-2xl bg-gray-50 p-5 text-sm text-gray-600"><LuCircleHelp className="shrink-0 text-ciano" size={24} /> Não encontrou a resposta? Envie sua dúvida pelo nosso <Link to="/contato" className="font-bold text-azul-oceano hover:text-verde-escuro">canal de contato</Link>.</div>
  </PaginaInstitucional>;
}

function BlocoLegal({ titulo, children }) { return <section className="border-b border-gray-100 py-7 first:pt-0 last:border-0"><h2 className="text-xl font-black text-verde-escuro">{titulo}</h2><div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-600">{children}</div></section>; }

export function TermosDeUso() {
  return <PaginaInstitucional etiqueta="Uso da plataforma" titulo="Termos de Uso" descricao="Estas condições resumem as regras de uso da LendLoop durante a fase inicial do produto.">
    <div className="mx-auto max-w-3xl"><p className="mb-8 rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">Última atualização: setembro de 2026. Este conteúdo é demonstrativo para o MVP e deverá passar por revisão jurídica antes do lançamento comercial.</p><BlocoLegal titulo="1. Conta e elegibilidade"><p>Você deve fornecer informações corretas, manter o acesso à conta em segurança e ter capacidade para celebrar os acordos de aluguel que combinar com outras pessoas.</p></BlocoLegal><BlocoLegal titulo="2. Anúncios e reservas"><p>Quem anuncia é responsável pela descrição, disponibilidade e estado do item. Quem aluga deve usar o item com cuidado, respeitar o período acordado e devolvê-lo conforme combinado.</p></BlocoLegal><BlocoLegal titulo="3. Pagamentos no MVP"><p>O fluxo de pagamento exibido na plataforma é simulado nesta etapa. A LendLoop não processa cobranças, transferências ou estornos enquanto essa funcionalidade não for disponibilizada oficialmente.</p></BlocoLegal><BlocoLegal titulo="4. Condutas não permitidas"><p>Não é permitido anunciar itens ilegais, perigosos, de origem duvidosa, usar dados de terceiros ou tentar conduzir a plataforma de maneira fraudulenta. Contas podem ser suspensas após análise.</p></BlocoLegal><BlocoLegal titulo="5. Atualizações"><p>Podemos atualizar estes termos conforme a evolução do serviço. Quando houver mudanças relevantes, elas serão comunicadas pelos canais da plataforma.</p></BlocoLegal></div>
  </PaginaInstitucional>;
}

export function PoliticaPrivacidade() {
  return <PaginaInstitucional etiqueta="Seus dados" titulo="Política de Privacidade" descricao="Transparência sobre as informações usadas para fazer a LendLoop funcionar no MVP.">
    <div className="mx-auto max-w-3xl"><div className="mb-8 flex gap-4 rounded-2xl border border-ciano/20 bg-ciano/5 p-5"><LuShieldCheck className="shrink-0 text-ciano" size={25} /><p className="text-sm leading-relaxed text-gray-700">Documentos de verificação são exibidos somente para administradores autorizados, dentro do fluxo de análise de identidade.</p></div><BlocoLegal titulo="Dados que coletamos"><p>Cadastro, dados de contato, informações do perfil, anúncios, solicitações de aluguel, conversas e arquivos enviados para verificação de identidade.</p></BlocoLegal><BlocoLegal titulo="Como usamos"><p>Usamos esses dados para criar sua conta, exibir anúncios, permitir reservas, apoiar a verificação de identidade e manter a segurança básica da comunidade.</p></BlocoLegal><BlocoLegal titulo="Compartilhamento"><p>Outras pessoas veem apenas informações necessárias para o aluguel, como nome de perfil e dados do anúncio. Não exibimos documentos de identidade publicamente.</p></BlocoLegal><BlocoLegal titulo="Seus controles"><p>Você pode atualizar dados de perfil, solicitar a exclusão da conta e entrar em contato para dúvidas sobre seus dados. Alguns registros podem ser preservados quando necessários para segurança e histórico do serviço.</p></BlocoLegal></div>
  </PaginaInstitucional>;
}

export function Contato() {
  const [enviado, setEnviado] = useState(false);
  return <PaginaInstitucional etiqueta="Fale com a LendLoop" titulo="Como podemos ajudar?" descricao="Envie uma mensagem para a equipe do MVP. Este canal é demonstrativo e não envia e-mails reais nesta versão.">
    <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]"><aside className="rounded-3xl bg-verde-escuro p-7 text-white"><LuMail className="text-verde-agua" size={27} /><h2 className="mt-5 text-xl font-black">Atendimento em fase MVP</h2><p className="mt-3 text-sm leading-relaxed text-white/75">Estamos reunindo dúvidas e sugestões para priorizar as próximas melhorias. Para assuntos de conta, inclua o e-mail usado no cadastro.</p><p className="mt-6 text-sm font-bold text-verde-agua">suporte@lendloop.com</p><p className="mt-2 text-xs text-white/50">Canal demonstrativo do produto.</p></aside><div className="rounded-3xl border border-gray-100 p-7 shadow-sm">{enviado ? <div className="py-12 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-verde-agua/15 text-verde-agua"><LuCheck size={28} /></span><h2 className="mt-5 text-xl font-black text-verde-escuro">Mensagem registrada</h2><p className="mt-2 text-sm text-gray-600">No MVP, este envio é apenas uma simulação. Obrigado por ajudar a melhorar a LendLoop.</p><button onClick={() => setEnviado(false)} className="mt-6 text-sm font-bold text-azul-oceano hover:text-verde-escuro">Enviar outra mensagem</button></div> : <form onSubmit={(evento) => { evento.preventDefault(); setEnviado(true); }} className="space-y-4"><label className="block text-sm font-bold text-gray-700">Nome<input required className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-ciano focus:ring-2 focus:ring-ciano/20" /></label><label className="block text-sm font-bold text-gray-700">E-mail<input type="email" required className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-ciano focus:ring-2 focus:ring-ciano/20" /></label><label className="block text-sm font-bold text-gray-700">Assunto<select className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-ciano"><option>Dúvida sobre aluguel</option><option>Problema com a conta</option><option>Sugestão para o MVP</option><option>Outro assunto</option></select></label><label className="block text-sm font-bold text-gray-700">Mensagem<textarea required rows={4} className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-ciano focus:ring-2 focus:ring-ciano/20" /></label><button className="w-full rounded-xl bg-verde-agua py-3.5 text-sm font-bold text-white hover:bg-ciano">Enviar mensagem</button></form>}</div></div>
  </PaginaInstitucional>;
}
