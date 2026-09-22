import { useEffect, useRef } from 'react';
import { LuTriangleAlert } from 'react-icons/lu';
import { useConfirmacaoInterna } from '../context/ConfirmacaoContext';

export function ModalConfirmacao() {
  const { pedido, responder } = useConfirmacaoInterna();
  const botaoConfirmarRef = useRef(null);

  // Fecha com Esc (cancela) e foca o botão de confirmar ao abrir
  useEffect(() => {
    if (!pedido) return;

    botaoConfirmarRef.current?.focus();

    function handleTecla(e) {
      if (e.key === 'Escape') responder(false);
      if (e.key === 'Enter') responder(true);
    }
    window.addEventListener('keydown', handleTecla);
    return () => window.removeEventListener('keydown', handleTecla);
  }, [pedido, responder]);

  if (!pedido) return null;

  const ehPerigo = pedido.variante === 'perigo';

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
      onClick={() => responder(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-confirmacao-titulo"
        aria-describedby="modal-confirmacao-mensagem"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {ehPerigo && (
            <div className="shrink-0 rounded-full bg-red-50 p-2">
              <LuTriangleAlert className="text-red-500" size={20} />
            </div>
          )}
          <div className="flex-1">
            <h2 id="modal-confirmacao-titulo" className="text-lg font-semibold text-verde-escuro">
              {pedido.titulo}
            </h2>
            <p id="modal-confirmacao-mensagem" className="mt-1 text-sm text-gray-600">
              {pedido.mensagem}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => responder(false)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            {pedido.textoCancelar}
          </button>
          <button
            type="button"
            ref={botaoConfirmarRef}
            onClick={() => responder(true)}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white cursor-pointer ${
              ehPerigo ? 'bg-red-500 hover:bg-red-600' : 'bg-verde-escuro hover:bg-verde-escuro/90'
            }`}
          >
            {pedido.textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}