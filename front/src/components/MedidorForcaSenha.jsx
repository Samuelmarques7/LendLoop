import { calcularForcaSenha } from '../utils/forcaSenha';

export function MedidorForcaSenha({ senha }) {
  if (!senha) return null;

  const { pontos, maximo, nivel, label, cor, corTexto } = calcularForcaSenha(senha);
  const largura = `${Math.min((pontos / maximo) * 100, 100)}%`;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${cor}`}
            style={{ width: largura }}
          />
        </div>
        <span className={`text-xs font-semibold w-12 text-right ${corTexto}`}>
          {label}
        </span>
      </div>
      <p className="text-xs text-gray-400">
        {nivel === 'forte'
          ? 'Boa senha!'
          : 'Mínimo 8 caracteres, com maiúsculas, números e símbolos.'}
      </p>
    </div>
  );
}