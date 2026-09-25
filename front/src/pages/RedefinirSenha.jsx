import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LuArrowLeft, LuArrowRight, LuCircleCheck, LuCircleX, LuEye, LuEyeOff, LuKeyRound, LuLoaderCircle } from 'react-icons/lu';
import { MedidorForcaSenha } from '../components/MedidorForcaSenha';
import { RecuperacaoLayout } from '../components/RecuperacaoLayout';
import { apiRequest } from '../services/api';
import { senhaEhForteOSuficiente } from '../utils/forcaSenha';

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [statusToken, setStatusToken] = useState('validando');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    let ativo = true;
    if (!token) {
      setStatusToken('invalido');
      return () => { ativo = false; };
    }

    apiRequest(`/api/redefinir-senha/validar?token=${encodeURIComponent(token)}`)
      .then(() => ativo && setStatusToken('valido'))
      .catch(() => ativo && setStatusToken('invalido'));
    return () => { ativo = false; };
  }, [token]);

  const senhasCoincidem = Boolean(confirmarSenha) && novaSenha === confirmarSenha;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro('');
    if (!senhaEhForteOSuficiente(novaSenha)) {
      setErro('Use ao menos 8 caracteres e combine letras maiúsculas, números e símbolos.');
      return;
    }
    if (!senhasCoincidem) {
      setErro('As senhas não coincidem. Confira os dois campos.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/api/redefinir-senha', { method: 'POST', body: { token, novaSenha } });
      setConcluido(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (error) {
      setErro(error.message);
      if (/expir|inválid/i.test(error.message)) setStatusToken('invalido');
    } finally {
      setLoading(false);
    }
  };

  if (statusToken === 'validando') {
    return <RecuperacaoLayout><div className="flex items-center gap-3 text-lg font-semibold text-verde-escuro"><LuLoaderCircle className="animate-spin text-2xl text-verde-agua" /> Validando seu link seguro...</div></RecuperacaoLayout>;
  }

  if (statusToken === 'invalido') {
    return (
      <RecuperacaoLayout>
        <div>
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-3xl text-red-500"><LuCircleX /></span>
          <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-red-500">Link indisponível</p>
          <h1 className="mt-2 text-3xl font-bold text-verde-escuro">Este link não é mais válido</h1>
          <p className="mt-4 leading-7 text-grafite/70">Ele pode ter expirado, já ter sido utilizado ou estar incompleto. Solicite um novo link para continuar.</p>
          <Link to="/esqueceu-senha" className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-verde-escuro px-5 py-4 font-bold text-white transition hover:bg-azul-oceano">Solicitar novo link <LuArrowRight /></Link>
          <Link to="/login" className="mt-6 inline-flex items-center gap-2 font-semibold text-verde-escuro hover:text-verde-agua"><LuArrowLeft /> Voltar para o login</Link>
        </div>
      </RecuperacaoLayout>
    );
  }

  if (concluido) {
    return (
      <RecuperacaoLayout>
        <div>
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-verde-agua/10 text-3xl text-verde-agua"><LuCircleCheck /></span>
          <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-verde-agua">Tudo certo</p>
          <h1 className="mt-2 text-3xl font-bold text-verde-escuro">Senha atualizada com sucesso</h1>
          <p className="mt-4 leading-7 text-grafite/70">Suas sessões anteriores foram encerradas. Entre novamente usando sua nova senha.</p>
          <Link to="/login" className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-verde-escuro px-5 py-4 font-bold text-white transition hover:bg-azul-oceano">Ir para o login <LuArrowRight /></Link>
        </div>
      </RecuperacaoLayout>
    );
  }

  return (
    <RecuperacaoLayout>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-verde-agua">Última etapa</p>
      <h1 className="mt-3 text-4xl font-bold text-verde-escuro">Crie uma nova senha</h1>
      <p className="mt-4 leading-7 text-grafite/70">Escolha uma senha diferente das anteriores e difícil de adivinhar.</p>

      {erro && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{erro}</div>}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="nova-senha" className="mb-2 block text-sm font-semibold text-grafite">Nova senha</label>
          <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-4 shadow-sm transition focus-within:border-ciano focus-within:ring-4 focus-within:ring-ciano/10">
            <LuKeyRound className="text-xl text-azul-oceano/55" />
            <input id="nova-senha" type={mostrarSenha ? 'text' : 'password'} value={novaSenha} onChange={(event) => setNovaSenha(event.target.value)} autoComplete="new-password" autoFocus className="recuperacao-input w-full bg-transparent px-3 py-4 text-grafite outline-none" placeholder="Crie uma senha forte" />
            <button type="button" onClick={() => setMostrarSenha((valor) => !valor)} className="p-2 text-xl text-grafite/50 hover:text-verde-escuro" aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}>{mostrarSenha ? <LuEyeOff /> : <LuEye />}</button>
          </div>
          <MedidorForcaSenha senha={novaSenha} />
        </div>

        <div>
          <label htmlFor="confirmar-senha" className="mb-2 block text-sm font-semibold text-grafite">Confirme a nova senha</label>
          <div className={`flex items-center rounded-2xl border bg-white px-4 shadow-sm transition focus-within:ring-4 ${confirmarSenha && !senhasCoincidem ? 'border-red-300 focus-within:ring-red-100' : 'border-gray-200 focus-within:border-ciano focus-within:ring-ciano/10'}`}>
            <LuKeyRound className="text-xl text-azul-oceano/55" />
            <input id="confirmar-senha" type={mostrarSenha ? 'text' : 'password'} value={confirmarSenha} onChange={(event) => setConfirmarSenha(event.target.value)} autoComplete="new-password" className="recuperacao-input w-full bg-transparent px-3 py-4 text-grafite outline-none" placeholder="Digite a senha novamente" />
          </div>
          {confirmarSenha && <p className={`mt-2 flex items-center gap-1.5 text-sm ${senhasCoincidem ? 'text-emerald-600' : 'text-red-600'}`}>{senhasCoincidem ? <><LuCircleCheck /> As senhas coincidem</> : 'As senhas ainda não coincidem.'}</p>}
        </div>

        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-verde-escuro px-5 py-4 font-bold text-white shadow-lg shadow-verde-escuro/15 transition hover:-translate-y-0.5 hover:bg-azul-oceano disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Atualizando senha...' : <>Atualizar senha <LuArrowRight /></>}</button>
      </form>
    </RecuperacaoLayout>
  );
}
