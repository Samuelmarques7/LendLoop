import { useState, useEffect } from 'react';
import { LuStar, LuX } from 'react-icons/lu';
import { apiRequest } from '../services/api';

const QUANTIDADE_RECENTES = 3;

function urlAvatarPadrao(nome) {
  const nomeSeguro = (nome || 'Usuário').trim() || 'Usuário';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeSeguro)}&background=29C354&color=fff&size=100`;
}

function formatarData(data) {
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Estrelas({ nota, tamanho = 16 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((valor) => (
        <LuStar
          key={valor}
          size={tamanho}
          className={valor <= nota ? 'text-yellow-400' : 'text-gray-200'}
          fill="currentColor"
        />
      ))}
    </div>
  );
}

function CardAvaliacao({ avaliacao }) {
  return (
    <div className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
      <div className="flex items-center gap-3 mb-2">
        <img
          src={avaliacao.autor?.avatar || urlAvatarPadrao(avaliacao.autor?.nome)}
          alt={avaliacao.autor?.nome}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-bold text-sm text-[#1A1A1A]">{avaliacao.autor?.nome || 'Usuário'}</p>
          <p className="text-xs text-gray-400">{formatarData(avaliacao.createdAt)}</p>
        </div>
      </div>
      <Estrelas nota={avaliacao.nota} tamanho={14} />
      {avaliacao.comentario && (
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{avaliacao.comentario}</p>
      )}
    </div>
  );
}

export function PainelAvaliacoes({ usuarioId }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const resposta = await apiRequest(`/api/avaliacoes/usuario/${usuarioId}`);
        setDados(resposta);
      } catch (e) {
        setDados(null);
      } finally {
        setCarregando(false);
      }
    }
    if (usuarioId) carregar();
  }, [usuarioId]);

  if (carregando) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <p className="text-gray-400 text-sm">Carregando avaliações...</p>
      </div>
    );
  }

  const total = dados?.total || 0;
  const media = dados?.media || 0;
  const avaliacoes = dados?.avaliacoes || [];
  const recentes = avaliacoes.slice(0, QUANTIDADE_RECENTES);

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#1A1A1A]">Avaliações</h2>
        {total > 0 && (
          <div className="flex items-center gap-2">
            <Estrelas nota={Math.round(media)} tamanho={18} />
            <span className="font-bold text-[#1A1A1A]">{media}</span>
            <span className="text-sm text-gray-400">({total})</span>
          </div>
        )}
      </div>

      {total === 0 ? (
        <p className="text-gray-400 italic">Ainda não há avaliações.</p>
      ) : (
        <>
          <div className="space-y-5">
            {recentes.map((avaliacao) => (
              <CardAvaliacao key={avaliacao._id} avaliacao={avaliacao} />
            ))}
          </div>

          {total > QUANTIDADE_RECENTES && (
            <button
              onClick={() => setModalAberto(true)}
              className="mt-6 text-sm font-bold text-[#0068F3] hover:text-[#032D54] transition-colors cursor-pointer"
            >
              Ver todas as {total} avaliações
            </button>
          )}
        </>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#032D54]">Todas as avaliações</h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-gray-400 hover:text-[#1A1A1A] cursor-pointer"
              >
                <LuX size={22} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-5 pr-1">
              {avaliacoes.map((avaliacao) => (
                <CardAvaliacao key={avaliacao._id} avaliacao={avaliacao} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}