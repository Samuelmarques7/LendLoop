import { useEffect, useRef } from 'react';

// Tela de status da solicitação de aluguel (estilo checkout):
//   estado = 'carregando' -> spinner enquanto a API responde
//   estado = 'sucesso'    -> check verde animado
//   estado = 'erro'       -> X vermelho com a mensagem do servidor
//
// Props:
//   estado    'carregando' | 'sucesso' | 'erro' | null (null = fechado)
//   titulo    título do item alugado (aparece no sucesso)
//   mensagem  texto de erro
//   acaoErro  { label, rota } opcional (ex.: verificar identidade)
//   onFechar  fecha o modal (só quando NÃO está carregando)
//   onVerSolicitacoes  ação principal do sucesso
//   onAcaoErro         ação extra do erro
export function ModalSolicitacao({
  estado,
  titulo,
  mensagem,
  acaoErro,
  onFechar,
  onVerSolicitacoes,
  onAcaoErro,
}) {
  const botaoRef = useRef(null);
  const aberto = Boolean(estado);
  const carregando = estado === 'carregando';

  useEffect(() => {
    if (!aberto || carregando) return;
    botaoRef.current?.focus();

    function handleTecla(e) {
      if (e.key === 'Escape') onFechar();
    }
    window.addEventListener('keydown', handleTecla);
    return () => window.removeEventListener('keydown', handleTecla);
  }, [aberto, carregando, onFechar]);

  // Trava o scroll da página enquanto o modal está aberto.
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = anterior; };
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div
      className="modal-solicitacao-fundo fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
      // Durante o envio o clique fora NÃO fecha: evita o usuário achar que cancelou.
      onClick={() => { if (!carregando) onFechar(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        aria-labelledby="modal-solicitacao-titulo"
        className="modal-solicitacao-caixa w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {carregando && (
          <>
            <div className="mx-auto mb-5 h-16 w-16 rounded-full border-4 border-gray-200 border-t-verde-agua modal-solicitacao-spin" aria-hidden="true" />
            <h2 id="modal-solicitacao-titulo" className="text-lg font-bold text-grafite">
              Enviando sua solicitação...
            </h2>
            <p className="mt-1 text-sm text-gray-500">Só um instante, não feche esta página.</p>
          </>
        )}

        {estado === 'sucesso' && (
          <>
            <svg className="mx-auto mb-5 h-16 w-16" viewBox="0 0 52 52" aria-hidden="true">
              <circle className="modal-solicitacao-circulo" cx="26" cy="26" r="24" fill="none" stroke="var(--color-verde-agua)" strokeWidth="3" />
              <path className="modal-solicitacao-marca" fill="none" stroke="var(--color-verde-agua)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" d="M15 27l8 8 15-16" />
            </svg>
            <h2 id="modal-solicitacao-titulo" className="text-lg font-bold text-grafite">
              Solicitação enviada!
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {titulo ? <>Pedido de aluguel de <strong>{titulo}</strong> enviado ao anfitrião.</> : 'Seu pedido foi enviado ao anfitrião.'}
            </p>
            <p className="mt-1 text-sm text-gray-500">Você será avisado quando ele responder. Nada foi cobrado ainda.</p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                ref={botaoRef}
                onClick={onVerSolicitacoes}
                className="w-full rounded-xl bg-grafite py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-black cursor-pointer"
              >
                Ver minhas solicitações
              </button>
              <button
                type="button"
                onClick={onFechar}
                className="w-full rounded-xl py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                Continuar navegando
              </button>
            </div>
          </>
        )}

        {estado === 'erro' && (
          <>
            <svg className="mx-auto mb-5 h-16 w-16" viewBox="0 0 52 52" aria-hidden="true">
              <circle className="modal-solicitacao-circulo" cx="26" cy="26" r="24" fill="none" stroke="#ef4444" strokeWidth="3" />
              <path className="modal-solicitacao-marca" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" d="M18 18l16 16M34 18L18 34" />
            </svg>
            <h2 id="modal-solicitacao-titulo" className="text-lg font-bold text-grafite">
              Não foi possível enviar
            </h2>
            <p className="mt-1 text-sm text-gray-600">{mensagem}</p>
            <div className="mt-6 flex flex-col gap-2">
              {acaoErro && (
                <button
                  type="button"
                  ref={botaoRef}
                  onClick={onAcaoErro}
                  className="w-full rounded-xl bg-grafite py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-black cursor-pointer"
                >
                  {acaoErro.label}
                </button>
              )}
              <button
                type="button"
                ref={acaoErro ? undefined : botaoRef}
                onClick={onFechar}
                className={acaoErro
                  ? 'w-full rounded-xl py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 cursor-pointer'
                  : 'w-full rounded-xl bg-grafite py-3 text-sm font-black uppercase tracking-widest text-white hover:bg-black cursor-pointer'}
              >
                {acaoErro ? 'Fechar' : 'Entendi'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}