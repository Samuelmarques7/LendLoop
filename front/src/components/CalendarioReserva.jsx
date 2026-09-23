import { DayPicker, DayButton } from 'react-day-picker';
import { ptBR } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { chaveDoDia, dataDaChave, diasDoPeriodo } from '../utils/datasReserva';

// Em ordem de prioridade: um dia reservado ainda pode ser o dia da devolução.
const TITULOS_DIA = {
  devolucao: 'Somente devolução',
  ocupado: 'Reservado',
  disponivel: 'Disponível',
};

function BotaoDia(props) {
  const tipo = Object.keys(TITULOS_DIA).find((modificador) => props.modifiers[modificador]);
  return <DayButton {...props} title={tipo ? TITULOS_DIA[tipo] : 'Indisponível'} />;
}

// Calendário de reserva: destaca os dias livres e só deixa escolher períodos
// em que todas as diárias estão disponíveis. O dia da devolução não precisa
// estar livre, porque a última diária termina na véspera.
export function CalendarioReserva({ diasLivres, diasOcupados, inicio, fim, onChange, meses = 1 }) {
  const escolhendoDevolucao = Boolean(inicio && !fim);

  const livre = (chave) => diasLivres.has(chave);
  const podeDevolverEm = (chave) =>
    escolhendoDevolucao && chave > inicio && diasDoPeriodo(inicio, chave).every(livre);

  function aoClicar(_, dia) {
    const chave = chaveDoDia(dia);
    if (podeDevolverEm(chave)) {
      onChange({ inicio, fim: chave });
    } else if (livre(chave)) {
      onChange({ inicio: chave, fim: '' });
    }
  }

  const chavesLivres = [...diasLivres].sort();
  const hoje = new Date();
  const mesInicial = inicio ? dataDaChave(inicio) : chavesLivres[0] ? dataDaChave(chavesLivres[0]) : hoje;
  const ultimoMes = chavesLivres.length ? dataDaChave(chavesLivres[chavesLivres.length - 1]) : undefined;

  return (
    <div className="calendario-reserva">
      <DayPicker
        mode="range"
        locale={ptBR}
        numberOfMonths={meses}
        defaultMonth={mesInicial}
        startMonth={hoje}
        endMonth={ultimoMes && ultimoMes > hoje ? ultimoMes : undefined}
        selected={inicio ? { from: dataDaChave(inicio), to: fim ? dataDaChave(fim) : undefined } : undefined}
        onSelect={aoClicar}
        disabled={(dia) => {
          const chave = chaveDoDia(dia);
          return chave !== inicio && chave !== fim && !livre(chave) && !podeDevolverEm(chave);
        }}
        modifiers={{
          disponivel: (dia) => livre(chaveDoDia(dia)),
          ocupado: (dia) => diasOcupados.has(chaveDoDia(dia)),
          devolucao: (dia) => {
            const chave = chaveDoDia(dia);
            return !livre(chave) && podeDevolverEm(chave);
          },
        }}
        modifiersClassNames={{ disponivel: 'dia-disponivel', ocupado: 'dia-ocupado', devolucao: 'dia-devolucao' }}
        components={{ DayButton: BotaoDia }}
      />
    </div>
  );
}

export function LegendaCalendario() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold text-gray-500">
      <span className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-[5px] bg-verde-agua/20 border border-verde-agua/40" /> Disponível
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3.5 h-3.5 rounded-[5px] bg-verde-escuro" /> Selecionado
      </span>
      <span className="flex items-center gap-1.5">
        <span className="px-1 rounded-[5px] bg-slate-100 text-slate-400 line-through font-bold">12</span> Reservado
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-gray-300 font-bold">12</span> Indisponível
      </span>
    </div>
  );
}
