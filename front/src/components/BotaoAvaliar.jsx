import { useState, useEffect } from 'react';
import { LuStar } from 'react-icons/lu';
import { apiRequest } from '../services/api';

export function BotaoAvaliar({ aluguelId, autorId, nomeAvaliado }) {
  const [jaAvaliado, setJaAvaliado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [nota, setNota] = useState(0);
  const [notaHover, setNotaHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    async function verificar() {
      try {
        const data = await apiRequest(`/api/avaliacoes/aluguel/${aluguelId}/autor/${autorId}`);
        setJaAvaliado(data.avaliado);
      } catch (e) {
        setJaAvaliado(false);
      }
    }
    verificar();
  }, [aluguelId, autorId]);

  async function handleEnviar() {
    if (nota === 0) {
      setErro('Selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    setErro(null);
    setEnviando(true);

    try {
      await apiRequest('/api/avaliacoes', {
        method: 'POST',
        body: { aluguel: aluguelId, autor: autorId, nota, comentario }
      });

      setJaAvaliado(true);
      setModalAberto(false);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (jaAvaliado === null) {
    return null;
  }

  if (jaAvaliado) {
    return (
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 py-1.5">
        Avaliação enviada
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalAberto(true)}
        className="flex items-center gap-1.5 bg-[#0068F3] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-xl hover:bg-[#032D54] transition-colors cursor-pointer shadow-sm"
      >
        <LuStar size={12} /> Avaliar
      </button>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-[#032D54] mb-1">Avaliar {nomeAvaliado}</h3>
            <p className="text-xs text-gray-400 mb-4">Como foi sua experiência?</p>

            <div className="flex gap-1 justify-center mb-4">
              {[1, 2, 3, 4, 5].map((valor) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setNota(valor)}
                  onMouseEnter={() => setNotaHover(valor)}
                  onMouseLeave={() => setNotaHover(0)}
                  className="cursor-pointer"
                >
                  <LuStar
                    size={32}
                    className={(notaHover || nota) >= valor ? 'text-yellow-400' : 'text-gray-200'}
                    fill="currentColor"
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Deixe um comentário (opcional)"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0297AA] outline-none text-[#1A1A1A] text-sm mb-4 resize-none"
            />

            {erro && (
              <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-medium">
                {erro}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviar}
                disabled={enviando}
                className={`flex-1 text-white font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-sm ${enviando ? 'bg-gray-400' : 'bg-[#29C354] hover:bg-[#032D54]'}`}
              >
                {enviando ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}