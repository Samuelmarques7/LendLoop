import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LuArrowRight, LuCheck, LuEye, LuEyeOff, LuKeyRound, LuMail, LuShieldCheck, LuSparkles } from 'react-icons/lu';
import {apiRequest } from '../services/api';
import { emailEhValido } from '../utils/validarEmail';
import logoMarca from '../assets/logo-painel-transparente.webp';

export default function Login() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    senha: ''
  });
  
  const [mensagem, setMensagem] = useState(null);
  const [erroEmail, setErroEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (e.target.name === 'email' && erroEmail) setErroEmail('');
    if (mensagem?.tipo === 'erro') setMensagem(null);
  };

  const handleBlurEmail = () => {
    if (credentials.email && !emailEhValido(credentials.email)) {
      setErroEmail('Digite um e-mail válido, ex: joao@email.com');
    } else {
      setErroEmail('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);

    if (!emailEhValido(credentials.email)) {
      setErroEmail('Digite um e-mail válido, ex: joao@email.com');
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest('/api/login', {
        method: 'POST',
        body: credentials
      });

      localStorage.setItem('usuarioLogado', 'true');
      localStorage.setItem('dadosUsuario', JSON.stringify(data.usuario));
      localStorage.setItem('token', data.token);

      setMensagem({ tipo: 'sucesso', texto: 'Bem-vindo de volta! Redirecionando...' });

      setTimeout(() => {
        navigate(data.usuario.papel === 'admin' ? '/paineladmin' : '/');
      }, 1000);
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f7f8] lg:grid lg:grid-cols-[minmax(24rem,.88fr)_minmax(32rem,1.12fr)]">
      <aside className="relative hidden min-h-screen overflow-hidden bg-verde-escuro px-10 py-10 text-white lg:flex lg:flex-col xl:px-16 xl:py-12">
        <div className="absolute -left-20 -top-24 h-80 w-80 rounded-full bg-azul-oceano/20 blur-3xl" aria-hidden="true" />
        <div className="absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-ciano/20 blur-3xl" aria-hidden="true" />
        <div className="absolute right-12 top-1/4 h-36 w-36 rounded-full border border-white/10" aria-hidden="true" />

        <Link to="/" aria-label="Voltar para a página inicial" className="relative z-10 inline-flex w-fit items-center gap-2 transition-opacity hover:opacity-80"><img src={logoMarca} alt="" className="h-12 w-12 scale-110 object-contain" /><span className="text-[28px] font-semibold tracking-[-0.06em]">LendLoop</span></Link>

        <div className="relative z-10 my-auto max-w-xl py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-verde-agua"><LuSparkles size={14} /> Bom ter você de volta</span>
          <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight xl:text-5xl">Seus próximos encontros começam por aqui.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/65 xl:text-lg">Entre para acompanhar suas locações, conversar com a comunidade e descobrir novas possibilidades perto de você.</p>
          <div className="mt-10 grid max-w-lg gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {['Anúncios e reservas', 'Mensagens centralizadas', 'Pagamentos organizados', 'Perfis mais seguros'].map((item) => <div key={item} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[.06] px-3.5 py-3 text-xs font-semibold text-white/80"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-verde-agua/15 text-verde-agua"><LuCheck size={13} strokeWidth={3} /></span>{item}</div>)}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 border-t border-white/10 pt-6 text-xs text-white/45"><LuShieldCheck size={16} className="text-verde-agua" /> Conexão protegida e acesso seguro à sua conta.</div>
      </aside>

      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-20">
        <Link to="/" aria-label="Voltar para a página inicial" className="mb-8 flex items-center gap-2 lg:hidden"><img src={logoMarca} alt="" className="h-11 w-11 scale-110 object-contain" /><span className="text-[25px] font-semibold tracking-[-0.06em] text-verde-escuro">LendLoop</span></Link>

        <div className="w-full max-w-lg">
          <div className="mb-8 text-center lg:text-left">
            <span className="text-xs font-extrabold uppercase tracking-[0.18em] text-ciano">Acesse sua conta</span>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-verde-escuro sm:text-4xl">Bem-vindo de volta</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">Use seu e-mail e senha para continuar de onde parou.</p>
          </div>

          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_-42px_rgba(3,45,84,.48)] sm:p-8">
            {mensagem && <div role="alert" className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 text-sm font-semibold ${mensagem.tipo === 'sucesso' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${mensagem.tipo === 'sucesso' ? 'bg-emerald-100' : 'bg-red-100'}`}>{mensagem.tipo === 'sucesso' ? '✓' : '!'}</span><span className="pt-0.5">{mensagem.texto}</span></div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div><label htmlFor="email-login" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">E-mail</label><div className="relative"><LuMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="email-login" type="email" name="email" value={credentials.email} onChange={handleChange} onBlur={handleBlurEmail} required autoComplete="email" autoFocus className={`w-full rounded-xl border bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-grafite outline-none transition focus:bg-white focus:ring-2 ${erroEmail ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-ciano focus:ring-ciano/15'}`} placeholder="joao@email.com" /></div>{erroEmail && <p className="mt-1.5 text-xs font-medium text-red-500">{erroEmail}</p>}</div>

              <div><div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="senha-login" className="text-xs font-bold uppercase tracking-wider text-slate-500">Senha</label><Link to="/esqueceu-senha" className="text-xs font-bold text-azul-oceano transition-colors hover:text-verde-escuro hover:underline">Esqueceu a senha?</Link></div><div className="relative"><LuKeyRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input id="senha-login" type={mostrarSenha ? 'text' : 'password'} name="senha" value={credentials.senha} onChange={handleChange} required autoComplete="current-password" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-11 text-sm text-grafite outline-none transition focus:border-ciano focus:bg-white focus:ring-2 focus:ring-ciano/15" placeholder="Digite sua senha" /><button type="button" onClick={() => setMostrarSenha((v) => !v)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-azul-oceano">{mostrarSenha ? <LuEyeOff size={18} /> : <LuEye size={18} />}</button></div></div>

              <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-verde-agua py-3.5 text-sm font-black text-white shadow-[0_10px_25px_-14px_rgba(46,195,77,.8)] transition-all hover:-translate-y-px hover:bg-ciano hover:shadow-lg disabled:cursor-wait disabled:opacity-60">{loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Entrando...</> : <>Entrar na minha conta <LuArrowRight size={18} /></>}</button>
            </form>

            <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-slate-100" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Novo por aqui?</span><span className="h-px flex-1 bg-slate-100" /></div>
            <Link to="/cadastro" className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-3.5 text-sm font-bold text-verde-escuro transition-all hover:border-ciano/40 hover:bg-ciano/5">Criar uma conta gratuita</Link>

            <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-400"><LuShieldCheck size={14} className="text-ciano" /> Nunca compartilharemos seus dados de acesso.</p>
          </section>

          <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">Ao entrar, você concorda com os <Link to="/termos" className="font-semibold text-slate-500 hover:underline">Termos de Uso</Link> e a <Link to="/privacidade" className="font-semibold text-slate-500 hover:underline">Política de Privacidade</Link>.</p>
        </div>
      </main>
    </div>
  );
}
