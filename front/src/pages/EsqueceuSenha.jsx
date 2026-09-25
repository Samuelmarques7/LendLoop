import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LuArrowLeft, LuArrowRight, LuCircleCheck, LuMail, LuShieldCheck } from 'react-icons/lu';
import { RecuperacaoLayout } from '../components/RecuperacaoLayout';
import { apiRequest } from '../services/api';
import { emailEhValido } from '../utils/validarEmail';

export default function EsqueceuSenha() {
  const [email, setEmail] = useState('');
  const [emailEnviado, setEmailEnviado] = useState('');
  const [erro, setErro] = useState('');
  const [erroEmail, setErroEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const validarEmail = () => {
    const valido = emailEhValido(email);
    setErroEmail(valido ? '' : 'Digite um e-mail válido, como nome@email.com.');
    return valido;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro('');
    if (!validarEmail()) return;

    setLoading(true);
    try {
      await apiRequest('/api/esqueceu-senha', { method: 'POST', body: { email: email.trim() } });
      setEmailEnviado(email.trim());
    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RecuperacaoLayout>
      {emailEnviado ? (
        <div>
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-verde-agua/10 text-3xl text-verde-agua">
            <LuCircleCheck />
          </span>
          <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-verde-agua">Solicitação recebida</p>
          <h1 className="mt-2 text-3xl font-bold text-verde-escuro">Confira sua caixa de entrada</h1>
          <p className="mt-4 leading-7 text-grafite/75">
            Se houver uma conta vinculada a <strong className="text-grafite">{emailEnviado}</strong>, enviaremos um link para criar uma nova senha.
          </p>
          <div className="mt-7 rounded-2xl border border-ciano/20 bg-ciano/5 p-4 text-sm leading-6 text-grafite/75">
            O e-mail pode levar alguns minutos. Confira também as pastas de spam e promoções. O link expira em uma hora.
          </div>
          <Link to="/login" className="mt-8 inline-flex items-center gap-2 font-semibold text-verde-escuro transition hover:text-verde-agua">
            <LuArrowLeft /> Voltar para o login
          </Link>
        </div>
      ) : (
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-verde-agua">Recuperação de acesso</p>
          <h1 className="mt-3 text-4xl font-bold text-verde-escuro">Esqueceu sua senha?</h1>
          <p className="mt-4 max-w-md leading-7 text-grafite/70">
            Informe o e-mail usado no cadastro. Enviaremos um link seguro para você definir uma nova senha.
          </p>

          {erro && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{erro}</div>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
            <div>
              <label htmlFor="email-recuperacao" className="mb-2 block text-sm font-semibold text-grafite">E-mail da conta</label>
              <div className={`flex items-center rounded-2xl border bg-white px-4 shadow-sm transition focus-within:ring-4 ${erroEmail ? 'border-red-300 focus-within:ring-red-100' : 'border-gray-200 focus-within:border-ciano focus-within:ring-ciano/10'}`}>
                <LuMail className="shrink-0 text-xl text-azul-oceano/55" />
                <input id="email-recuperacao" type="email" value={email} autoFocus autoComplete="email" onChange={(event) => { setEmail(event.target.value); setErroEmail(''); }} onBlur={() => email && validarEmail()} placeholder="voce@email.com" className="recuperacao-input w-full bg-transparent px-3 py-4 text-grafite outline-none placeholder:text-grafite/35" />
              </div>
              {erroEmail && <p className="mt-2 text-sm text-red-600">{erroEmail}</p>}
            </div>

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-verde-escuro px-5 py-4 font-bold text-white shadow-lg shadow-verde-escuro/15 transition hover:-translate-y-0.5 hover:bg-azul-oceano disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Enviando link...' : <>Enviar link de recuperação <LuArrowRight /></>}
            </button>
          </form>

          <div className="mt-6 flex gap-3 rounded-2xl bg-gray-100/70 p-4 text-sm leading-6 text-grafite/65">
            <LuShieldCheck className="mt-0.5 shrink-0 text-lg text-verde-agua" />
            Por segurança, a resposta será a mesma mesmo que o e-mail não esteja cadastrado.
          </div>

          <Link to="/login" className="mt-8 inline-flex items-center gap-2 font-semibold text-verde-escuro transition hover:text-verde-agua">
            <LuArrowLeft /> Voltar para o login
          </Link>
        </div>
      )}
    </RecuperacaoLayout>
  );
}
