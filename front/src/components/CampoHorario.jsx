import { LuChevronDown, LuClock3 } from 'react-icons/lu';

const HORAS = Array.from({ length: 24 }, (_, indice) => String(indice).padStart(2, '0'));
const MINUTOS_PADRAO = ['00', '15', '30', '45'];

export function CampoHorario({ label, value = '09:00', onChange, disabled = false }) {
  const [horaAtual = '09', minutoAtual = '00'] = String(value || '09:00').split(':');
  const minutos = MINUTOS_PADRAO.includes(minutoAtual)
    ? MINUTOS_PADRAO
    : [...MINUTOS_PADRAO, minutoAtual].sort((a, b) => Number(a) - Number(b));

  function atualizar(hora, minuto) {
    onChange?.(`${hora}:${minuto}`);
  }

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all focus-within:border-verde-agua focus-within:ring-2 focus-within:ring-verde-agua/15">
      <div className="flex min-h-[4.25rem] items-stretch">
        <span className="flex w-12 shrink-0 items-center justify-center border-r border-gray-100 bg-gray-50 text-azul-oceano transition-colors group-focus-within:bg-verde-agua/10 group-focus-within:text-verde-escuro">
          <LuClock3 size={19} aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1 px-3 py-2">
          <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">{label}</span>
          <div className="mt-0.5 flex items-center gap-1 text-grafite">
            <label className="relative">
              <span className="sr-only">Hora de {label.toLowerCase()}</span>
              <select
                aria-label={`Hora de ${label.toLowerCase()}`}
                value={horaAtual}
                disabled={disabled}
                onChange={(evento) => atualizar(evento.target.value, minutoAtual)}
                className="appearance-none bg-transparent py-0.5 pl-0.5 pr-5 text-base font-bold outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {HORAS.map((hora) => <option key={hora} value={hora}>{hora}</option>)}
              </select>
              <LuChevronDown size={12} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400" />
            </label>

            <span className="pb-0.5 text-base font-black text-gray-300">:</span>

            <label className="relative">
              <span className="sr-only">Minutos de {label.toLowerCase()}</span>
              <select
                aria-label={`Minutos de ${label.toLowerCase()}`}
                value={minutoAtual}
                disabled={disabled}
                onChange={(evento) => atualizar(horaAtual, evento.target.value)}
                className="appearance-none bg-transparent py-0.5 pl-0.5 pr-5 text-base font-bold outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {minutos.map((minuto) => <option key={minuto} value={minuto}>{minuto}</option>)}
              </select>
              <LuChevronDown size={12} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400" />
            </label>

            <span className="ml-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
