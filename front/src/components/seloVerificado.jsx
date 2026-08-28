import { LuBadgeCheck } from 'react-icons/lu';

export default function SeloVerificado({ tamanho = 'md' }) {
  const classes = tamanho === 'sm'
    ? 'text-xs px-2 py-0.5 gap-1'
    : 'text-sm px-3 py-1 gap-1.5';

  return (
    <span
      title="Identidade verificada pela equipe do LendLoop"
      className={`inline-flex items-center ${classes} bg-[#0068F3]/10 text-[#0068F3] font-bold rounded-full`}
    >
      <LuBadgeCheck size={tamanho === 'sm' ? 14 : 16} />
      Verificado
    </span>
  );
}
