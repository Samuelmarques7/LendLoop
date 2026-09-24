import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'react-day-picker/locale';
import { LuCalendarDays, LuChevronDown } from 'react-icons/lu';
import 'react-day-picker/style.css';
import { chaveDoDia, dataDaChave, formatarChave } from '../utils/datasReserva';

export function SeletorDataBusca({ valor, onChange, dataMinima, placeholder, alinhar = 'left' }) {
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef(null);
  const dataSelecionada = valor ? dataDaChave(valor) : undefined;
  const limiteInferior = dataMinima ? dataDaChave(dataMinima) : new Date();
  limiteInferior.setHours(0, 0, 0, 0);

  useEffect(() => {
    function fecharAoClicarFora(evento) {
      if (raizRef.current && !raizRef.current.contains(evento.target)) setAberto(false);
    }

    function fecharComEscape(evento) {
      if (evento.key === 'Escape') setAberto(false);
    }

    document.addEventListener('mousedown', fecharAoClicarFora);
    document.addEventListener('keydown', fecharComEscape);
    return () => {
      document.removeEventListener('mousedown', fecharAoClicarFora);
      document.removeEventListener('keydown', fecharComEscape);
    };
  }, []);

  function selecionar(data) {
    if (!data) return;
    onChange(chaveDoDia(data));
    setAberto(false);
  }

  return (
    <div ref={raizRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setAberto((estado) => !estado)}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        className={`flex min-h-12 w-full min-w-0 items-center gap-3 rounded-xl border bg-white px-3 text-left text-sm transition-all ${aberto ? 'border-azul-oceano ring-2 ring-azul-oceano/10' : 'border-slate-200 hover:border-azul-oceano/50'}`}
      >
        <LuCalendarDays size={17} className="shrink-0 text-azul-oceano" />
        <span className={`min-w-0 flex-1 truncate font-semibold ${valor ? 'text-grafite' : 'text-slate-400'}`}>
          {valor ? formatarChave(valor) : placeholder}
        </span>
        <LuChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label="Escolher data"
          className={`calendario-busca absolute top-[calc(100%+8px)] z-50 w-[304px] max-w-[calc(100vw-32px)] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_20px_50px_rgba(7,43,74,0.18)] ${alinhar === 'right' ? 'right-0' : 'left-0'}`}
        >
          <DayPicker
            mode="single"
            locale={ptBR}
            selected={dataSelecionada}
            onSelect={selecionar}
            defaultMonth={dataSelecionada || limiteInferior}
            startMonth={limiteInferior}
            disabled={{ before: limiteInferior }}
          />
          {valor && (
            <button
              type="button"
              onClick={() => { onChange(''); setAberto(false); }}
              className="mt-1 w-full rounded-lg py-2 text-xs font-bold text-azul-oceano transition-colors hover:bg-azul-oceano/5"
            >
              Limpar data
            </button>
          )}
        </div>
      )}
    </div>
  );
}
