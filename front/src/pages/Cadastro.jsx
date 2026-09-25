import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuArrowRight, LuCheck, LuEye, LuEyeOff, LuKeyRound, LuMail, LuMapPin, LuShieldCheck, LuSparkles, LuUserRound } from 'react-icons/lu';
import {apiRequest } from '../services/api';
import { MedidorForcaSenha } from '../components/MedidorForcaSenha';
import { senhaEhForteOSuficiente } from '../utils/forcaSenha';
import { emailEhValido } from '../utils/validarEmail';
import logoMarca from '../assets/logo-painel-transparente.png';

const OBJETIVOS = [
  { valor: 'ambos', titulo: 'Ambos', descricao: 'Quero alugar e também disponibilizar meus itens' },
  { valor: 'locatario', titulo: 'Apenas alugar', descricao: 'Quero procurar itens para alugar' },
  { valor: 'locador', titulo: 'Apenas disponibilizar', descricao: 'Quero colocar meus itens na plataforma para gerar renda' },
];

function formatarCep(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
}

export default function Cadastro() {
  const navigate = useNavigate();
  const consultaCepAtual = useRef(0);
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
  const [carregandoCep, setCarregandoCep] = useState(false);
  const [cepConfirmado, setCepConfirmado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleCepChange = async (e) => {
    const idConsulta = ++consultaCepAtual.current;
    const cepDigitado = formatarCep(e.target.value);
    setFormData(prev => ({ ...prev, cep: cepDigitado, localizacao: '' }));
    setCepConfirmado(false);
    setCarregandoCep(false);
    setMensagem(null);

    const cepLimpo = cepDigitado.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setCarregandoCep(true);
    try {
      const resposta = await fetch(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
      if (!resposta.ok) throw new Error('CEP não encontrado');
      const dados = await resposta.json();
      if (!dados.city || !dados.state) throw new Error('Localização incompleta');
      if (consultaCepAtual.current !== idConsulta) return;
      setFormData(prev => ({ ...prev, localizacao: `${dados.city}, ${dados.state}` }));
      setCepConfirmado(true);
    } catch {
      if (consultaCepAtual.current !== idConsulta) return;
      setMensagem({ tipo: 'erro', texto: 'CEP não encontrado. Confira os números e tente novamente.' });
    } finally {
      if (consultaCepAtual.current === idConsulta) setCarregandoCep(false);
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
    if (enviando) return;
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

    if (!cepConfirmado || !formData.localizacao) {
      setMensagem({ tipo: 'erro', texto: 'Informe um CEP válido e aguarde a confirmação da localização.' });
      return;
    }

    setEnviando(true);
    try {
      const data = await apiRequest('/api/usuarios', {
              method: 'POST',
              body: formData
            });

      localStorage.setItem('usuarioLogado', 'true');
      localStorage.setItem('token', data.token);
      localStorage.setItem('dadosUsuario', JSON.stringify(data.usuario));

      setMensagem({ tipo: 'sucesso', texto: 'Conta criada com sucesso! Redirecionando...' });
      setFormData({ nome: '', email: '', senha: '', telefone: '',cep: '', localizacao: '', objetivo: 'ambos' });
        
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: error.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f7f8] lg:grid lg:grid-cols-[minmax(24rem,.82fr)_minmax(38rem,1.18fr)]">
      <aside className="relative hidden min-h-screen overflow-hidden bg-verde-escuro px-10 py-10 text-white lg:flex lg:flex-col xl:px-16 xl:py-12">
        <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-azul-oceano/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-28 -top-24 h-96 w-96 rounded-full bg-ciano/20 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-16 right-8 h-36 w-36 rounded-full border border-white/10" aria-hidden="true" />
        <div className="absolute bottom-5 right-24 h-20 w-20 rounded-full border border-verde-agua/20" aria-hidden="true" />

        <Link to="/" aria-label="Voltar para a página inicial" className="relative z-10 inline-flex w-fit items-center gap-2 transition-opacity hover:opacity-80">
          <img src={logoMarca} alt="" className="h-12 w-12 scale-110 object-contain" />
          <span className="text-[28px] font-semibold tracking-[-0.06em]">LendLoop</span>
        </Link>

        <div className="relative z-10 my-auto max-w-xl py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-verde-agua"><LuSparkles size={14} /> Compartilhar faz mais sentido</span>
          <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight xl:text-5xl">Tudo o que você precisa pode estar mais perto do que imagina.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/65 xl:text-lg">Entre para uma comunidade que transforma itens parados em acesso, economia e novas possibilidades.</p>

          <div className="mt-10 space-y-4">
            {['Encontre itens disponíveis na sua região', 'Ganhe dinheiro com o que você já possui', 'Negocie com mais segurança e transparência'].map((beneficio) => <div key={beneficio} className="flex items-center gap-3 text-sm font-semibold text-white/85"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-verde-agua/15 text-verde-agua"><LuCheck size={15} strokeWidth={3} /></span>{beneficio}</div>)}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 border-t border-white/10 pt-6 text-xs text-white/45"><LuShieldCheck size={16} className="text-verde-agua" /> Seus dados são protegidos e usados com responsabilidade.</div>
      </aside>

      <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-8 lg:px-10 lg:py-12 xl:px-16">
        <Link to="/" aria-label="Voltar para a página inicial" className="mb-7 flex items-center justify-center gap-2 lg:hidden">
          <img src={logoMarca} alt="" className="h-10 w-10 scale-110 object-contain" />
          <span className="text-[24px] font-semibold tracking-[-0.06em] text-verde-escuro">LendLoop</span>
        </Link>

        <div className="w-full max-w-3xl">
          <div className="mb-8">
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-ciano">Comece agora</span>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-verde-escuro sm:text-4xl">Crie sua conta</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">Leva só alguns minutos. Depois você já pode explorar tudo o que existe perto de você.</p>
          </div>

          {mensagem && <div role="alert" className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${mensagem.tipo === 'sucesso' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}><span className="mt-0.5">{mensagem.tipo === 'sucesso' ? '✓' : '!'}</span>{mensagem.texto}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_-40px_rgba(3,45,84,.35)] sm:p-7">
              <CabecalhoSecao numero="1" titulo="Seus dados" descricao="Como vamos identificar e entrar em contato com você." />
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <CampoCadastro icone={LuUserRound} label="Nome completo" erro="">
                  <input type="text" name="nome" value={formData.nome} onChange={handleChange} required autoComplete="name" className="peer w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-grafite outline-none transition focus:border-ciano focus:bg-white focus:ring-2 focus:ring-ciano/15" placeholder="João da Silva" />
                </CampoCadastro>
                <CampoCadastro icone={LuMail} label="E-mail" erro={erroEmail}>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlurEmail} required autoComplete="email" className={`peer w-full rounded-xl border bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-grafite outline-none transition focus:bg-white focus:ring-2 ${erroEmail ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-ciano focus:ring-ciano/15'}`} placeholder="joao@email.com" />
                </CampoCadastro>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_-40px_rgba(3,45,84,.35)] sm:p-7">
              <CabecalhoSecao numero="2" titulo="Segurança e região" descricao="Proteja sua conta e encontre oportunidades próximas." />
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="senha-cadastro" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Crie uma senha</label>
                  <div className="relative"><LuKeyRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="senha-cadastro" type={mostrarSenha ? 'text' : 'password'} name="senha" value={formData.senha} onChange={handleChange} required minLength={8} autoComplete="new-password" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-11 text-sm text-grafite outline-none transition focus:border-ciano focus:bg-white focus:ring-2 focus:ring-ciano/15" placeholder="Mínimo de 8 caracteres" /><button type="button" onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-azul-oceano">{mostrarSenha ? <LuEyeOff size={18} /> : <LuEye size={18} />}</button></div>
                  <MedidorForcaSenha senha={formData.senha} />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="cep-cadastro" className="text-xs font-bold uppercase tracking-wider text-slate-500">Seu CEP</label><a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-azul-oceano hover:underline">Não sei meu CEP</a></div>
                  <div className="relative"><LuMapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="cep-cadastro" type="text" name="cep" value={formData.cep} onChange={handleCepChange} inputMode="numeric" autoComplete="postal-code" maxLength={9} required className={`w-full rounded-xl border bg-slate-50 py-3.5 pl-11 pr-10 text-sm text-grafite outline-none transition focus:bg-white focus:ring-2 ${cepConfirmado ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100' : 'border-slate-200 focus:border-ciano focus:ring-ciano/15'}`} placeholder="00000-000" />{carregandoCep && <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-ciano/25 border-t-ciano" />}{cepConfirmado && !carregandoCep && <LuCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} strokeWidth={3} />}</div>
                  {carregandoCep && <p className="mt-2 text-xs font-medium text-azul-oceano">Consultando localização...</p>}
                  {formData.localizacao && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><LuCheck size={14} strokeWidth={3} /> {formData.localizacao}</p>}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_55px_-40px_rgba(3,45,84,.35)] sm:p-7">
              <CabecalhoSecao numero="3" titulo="Como você quer usar a LendLoop?" descricao="Você poderá alterar essa preferência quando quiser." />
              <fieldset className="mt-6 grid gap-3 md:grid-cols-3"><legend className="sr-only">Objetivo principal da conta</legend>{OBJETIVOS.map((opcao) => { const ativo = formData.objetivo === opcao.valor; return <label key={opcao.valor} className={`relative flex min-h-36 cursor-pointer flex-col rounded-2xl border p-4 transition-all ${ativo ? 'border-verde-agua bg-verde-agua/[.07] shadow-[0_8px_24px_-18px_rgba(46,195,77,.8)] ring-1 ring-verde-agua' : 'border-slate-200 bg-slate-50/60 hover:-translate-y-0.5 hover:border-ciano/50 hover:bg-white'}`}><input type="radio" name="objetivo" value={opcao.valor} checked={ativo} onChange={() => handleObjetivoChange(opcao.valor)} className="sr-only" /><span className={`mb-4 flex h-8 w-8 items-center justify-center rounded-full border ${ativo ? 'border-verde-agua bg-verde-agua text-white' : 'border-slate-200 bg-white text-transparent'}`}><LuCheck size={15} strokeWidth={3} /></span><span className={`text-sm font-bold ${ativo ? 'text-verde-escuro' : 'text-slate-700'}`}>{opcao.titulo}</span><span className="mt-1 text-xs leading-relaxed text-slate-500">{opcao.descricao}</span></label>})}</fieldset>
            </section>

            <div className="rounded-3xl bg-verde-escuro p-5 text-white shadow-[0_20px_45px_-26px_rgba(3,45,84,.65)] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
              <div className="mb-5 flex gap-3 sm:mb-0"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-verde-agua/15 text-verde-agua"><LuShieldCheck size={20} /></span><div><p className="text-sm font-bold">Cadastro seguro</p><p className="mt-1 max-w-sm text-xs leading-relaxed text-white/55">Ao continuar, você concorda com nossos <Link to="/termos" className="text-white underline underline-offset-2">Termos</Link> e <Link to="/privacidade" className="text-white underline underline-offset-2">Política de Privacidade</Link>.</p></div></div>
              <button type="submit" disabled={enviando || carregandoCep} className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-verde-agua px-6 py-3.5 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-px hover:bg-ciano disabled:cursor-wait disabled:opacity-60 sm:w-auto">{enviando ? 'Criando sua conta...' : <>Criar minha conta <LuArrowRight size={18} /></>}</button>
            </div>

            <p className="pb-2 text-center text-sm text-slate-500">Já faz parte da comunidade? <Link to="/login" className="font-bold text-azul-oceano transition-colors hover:text-verde-escuro hover:underline">Entrar na minha conta</Link></p>
          </form>
        </div>
      </main>
    </div>
  );
}

function CabecalhoSecao({ numero, titulo, descricao }) {
  return <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-verde-escuro text-xs font-black text-white">{numero}</span><div><h3 className="font-black text-verde-escuro">{titulo}</h3><p className="mt-0.5 text-xs leading-relaxed text-slate-500 sm:text-sm">{descricao}</p></div></div>;
}

function CampoCadastro({ icone, label, erro, children }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><span className="relative block"><span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icone({ size: 18 })}</span>{children}</span>{erro && <span className="mt-1.5 block text-xs font-medium text-red-500">{erro}</span>}</label>;
}
