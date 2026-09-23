import { useMemo, useState } from 'react';
import { LuCamera, LuImagePlus, LuX } from 'react-icons/lu';

export function VistoriaFotos({ titulo, descricao, onEnviar, enviando = false }) {
  const [arquivos, setArquivos] = useState([]);
  const previews = useMemo(() => arquivos.map((arquivo) => ({
    arquivo,
    url: URL.createObjectURL(arquivo)
  })), [arquivos]);

  function selecionar(evento) {
    const novos = Array.from(evento.target.files || []);
    setArquivos((atuais) => [...atuais, ...novos].slice(0, 8));
    evento.target.value = '';
  }

  function remover(indice) {
    setArquivos((atuais) => atuais.filter((_, i) => i !== indice));
  }

  async function enviar() {
    if (arquivos.length < 3) return;
    await onEnviar(arquivos);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-azul-oceano/20 bg-azul-oceano/[0.05] p-4">
        <div className="flex gap-3">
          <div className="mt-0.5 text-azul-oceano"><LuCamera size={19} /></div>
          <div>
            <h3 className="text-sm font-bold text-verde-escuro">{titulo}</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{descricao}</p>
          </div>
        </div>
      </div>

      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center transition hover:border-azul-oceano hover:bg-azul-oceano/10">
        <LuImagePlus size={22} className="mb-2 text-azul-oceano" />
        <span className="text-sm font-semibold text-grafite">Adicionar fotos de detalhes</span>
        <span className="mt-1 text-xs text-gray-500">Mínimo de 3, máximo de 8 · JPG ou PNG</span>
        <input type="file" accept="image/jpeg,image/png" multiple capture="environment" className="sr-only" onChange={selecionar} />
      </label>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {previews.map(({ arquivo, url }, indice) => (
            <div key={`${arquivo.name}-${indice}`} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              <img src={url} alt={`Foto de vistoria ${indice + 1}`} className="h-full w-full object-cover" />
              <button type="button" onClick={() => remover(indice)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black" aria-label="Remover foto">
                <LuX size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" disabled={arquivos.length < 3 || enviando} onClick={enviar} className="w-full rounded-lg bg-grafite py-3 text-sm font-semibold text-white transition hover:bg-azul-oceano disabled:cursor-not-allowed disabled:bg-gray-300">
        {enviando ? 'Enviando fotos...' : `Registrar vistoria (${arquivos.length}/3 mín.)`}
      </button>
    </div>
  );
}
