import { useEffect } from 'react';
import { LuCircleCheck, LuCircleX, LuX } from 'react-icons/lu';
import { useNotificacao } from '../context/NotificacaoContext';

const ESTILOS = {
  sucesso: {
    bg: 'bg-verde-agua/10',
    borda: 'border-verde-agua/30',
    texto: 'text-verde-escuro',
    icone: LuCircleCheck,
    corIcone: 'text-verde-agua',
  },
  erro: {
    bg: 'bg-red-50',
    borda: 'border-red-200',
    texto: 'text-red-700',
    icone: LuCircleX,
    corIcone: 'text-red-500',
  },
};

export function Toast() {
  const { notificacao, fecharNotificacao } = useNotificacao();

  // Permite fechar com a tecla Esc
  useEffect(() => {
    if (!notificacao) return;
    function handleEsc(e) {
      if (e.key === 'Escape') fecharNotificacao();
    }
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [notificacao, fecharNotificacao]);

  if (!notificacao) return null;

  const estilo = ESTILOS[notificacao.tipo] || ESTILOS.erro;
  const Icone = estilo.icone;

  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full animate-in fade-in slide-in-from-bottom-2">
      <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg font-medium ${estilo.bg} ${estilo.borda} ${estilo.texto}`}>
        <Icone className={`shrink-0 mt-0.5 ${estilo.corIcone}`} size={20} />
        <p className="flex-grow text-sm">{notificacao.texto}</p>
        <button
          onClick={fecharNotificacao}
          className="shrink-0 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <LuX size={16} />
        </button>
      </div>
    </div>
  );
}