import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fotoOtimizada } from "../utils/fotos";
import { LuChevronLeft, LuChevronRight, LuImageOff, LuX } from "react-icons/lu";

const MAX_NA_GRADE = 5;
const DISTANCIA_MIN_SWIPE = 50;

// Foto com fallback: se a URL quebrar, mostra um placeholder em vez do ícone de imagem quebrada.
function Foto({ src, alt, className, contain = false, prioridade = false }) {
  const [falhou, setFalhou] = useState(false);

  if (!src || falhou) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gray-100 text-gray-300">
        <LuImageOff size={22} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Sem foto</span>
      </div>
    );
  }

  // Foto única: mostra a imagem inteira, com uma versão desfocada dela mesma no fundo
  // para preencher as laterais sem esticar nem cortar.
  if (contain) {
    return (
      <>
        <img
          src={fotoOtimizada(src, 600)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl"
        />
        <img
          src={src}
          alt={alt}
          onError={() => setFalhou(true)}
          fetchPriority={prioridade ? 'high' : 'auto'}
          className={`relative h-full w-full object-contain ${className || ""}`}
        />
      </>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={prioridade ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={prioridade ? 'high' : 'auto'}
      onError={() => setFalhou(true)}
      className={className}
    />
  );
}

function Lightbox({ fotos, titulo, indiceInicial, onFechar }) {
  const [indice, setIndice] = useState(indiceInicial);
  const toqueInicialX = useRef(null);
  const dialogRef = useRef(null);
  const total = fotos.length;

  const anterior = useCallback(() => setIndice((i) => (i - 1 + total) % total), [total]);
  const proxima = useCallback(() => setIndice((i) => (i + 1) % total), [total]);

  useEffect(() => {
    function aoTeclar(evento) {
      if (evento.key === "Escape") { evento.preventDefault(); onFechar(); }
      if (evento.key === "ArrowLeft") anterior();
      if (evento.key === "ArrowRight") proxima();
    }

    // Trava a rolagem da página enquanto o lightbox está aberto.
    const overflowOriginal = document.body.style.overflow;
    const focoOriginal = document.activeElement;
    const dialog = dialogRef.current;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", aoTeclar);

    return () => {
      document.body.style.overflow = overflowOriginal;
      document.removeEventListener("keydown", aoTeclar);
      dialog.close();
      focoOriginal?.focus();
    };
  }, [anterior, proxima, onFechar]);

  function aoTocarInicio(evento) {
    toqueInicialX.current = evento.touches[0].clientX;
  }

  function aoTocarFim(evento) {
    if (toqueInicialX.current === null) return;
    const diferenca = evento.changedTouches[0].clientX - toqueInicialX.current;
    toqueInicialX.current = null;

    if (Math.abs(diferenca) < DISTANCIA_MIN_SWIPE) return;
    if (diferenca > 0) anterior();
    else proxima();
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-label={`Fotos de ${titulo}`}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-black p-0 text-white open:flex open:flex-col backdrop:bg-black/90"
      onCancel={(evento) => { evento.preventDefault(); onFechar(); }}
    >
      <div className="flex items-center justify-between p-4 text-white" onClick={(e) => e.stopPropagation()}>
        <span aria-live="polite" className="text-sm font-bold tabular-nums">
          {indice + 1} / {total}
        </span>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar galeria"
          className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
        >
          <LuX size={22} />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16"
        onTouchStart={aoTocarInicio}
        onTouchEnd={aoTocarFim}
        onTouchCancel={() => { toqueInicialX.current = null; }}
      >
        {total > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); anterior(); }}
            aria-label="Foto anterior"
            className="absolute left-1 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25 sm:left-2 sm:p-3"
          >
            <LuChevronLeft size={26} />
          </button>
        )}

        <Foto
          key={indice}
          src={fotoOtimizada(fotos[indice], 2400)}
          alt={`${titulo} - foto ${indice + 1} de ${total}`}
          prioridade
          className="h-full w-full min-w-0 select-none object-contain"
        />

        {total > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); proxima(); }}
            aria-label="Próxima foto"
            className="absolute right-1 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25 sm:right-2 sm:p-3"
          >
            <LuChevronRight size={26} />
          </button>
        )}
      </div>

      {total > 1 && (
        <div
          className="mx-auto flex max-w-full shrink-0 gap-2 overflow-x-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {fotos.map((foto, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndice(i)}
              aria-label={`Ir para a foto ${i + 1}`}
              aria-current={i === indice}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-all sm:h-16 sm:w-16 ${
                i === indice
                  ? "scale-105 border-white opacity-100 ring-2 ring-white/40"
                  : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <Foto key={foto} src={fotoOtimizada(foto, 160)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </dialog>, document.body
  );
}

export function GaleriaFotos({ fotos = [], titulo }) {
  const [lightboxAberto, setLightboxAberto] = useState(false);
  const [indiceInicial, setIndiceInicial] = useState(0);
  const [indiceMobile, setIndiceMobile] = useState(0);

  const lista = Array.isArray(fotos) ? fotos.filter((foto) => typeof foto === 'string' && foto.trim()) : [];
  const total = lista.length;
  const fechar = useCallback(() => setLightboxAberto(false), []);

  function abrir(indice) {
    setIndiceInicial(indice);
    setLightboxAberto(true);
  }

  if (total === 0) {
    return (
      <div className="mb-8 flex h-[280px] items-center justify-center overflow-hidden rounded-3xl bg-gray-100 sm:mb-12 sm:h-[400px]">
        <div className="flex flex-col items-center gap-2 text-gray-300">
          <LuImageOff size={40} />
          <span className="text-sm font-bold">Este anúncio ainda não tem fotos</span>
        </div>
      </div>
    );
  }

  // A grade se adapta à quantidade de fotos, sem deixar quadros vazios.
  const visiveisNaGrade = Math.min(total, MAX_NA_GRADE);
  const secundarias = lista.slice(1);
  const restantes = total - MAX_NA_GRADE;

  const classesGrade = {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3 sm:grid-rows-2",
    4: "sm:grid-cols-4 sm:grid-rows-2",
    5: "sm:grid-cols-4 sm:grid-rows-2",
  }[visiveisNaGrade];

  // A foto principal ocupa as duas linhas; as demais preenchem o espaço restante.
  const classePrincipal = {
    1: "sm:col-span-1",
    2: "sm:col-span-1",
    3: "sm:col-span-2 sm:row-span-2",
    4: "sm:col-span-2 sm:row-span-2",
    5: "sm:col-span-2 sm:row-span-2",
  }[visiveisNaGrade];

  return (
    <>
      <div className="relative mb-8 sm:mb-12">
        <div
          onScroll={(evento) => {
            const el = evento.currentTarget;
            setIndiceMobile(Math.round(el.scrollLeft / el.clientWidth));
          }}
          className={`flex h-[300px] snap-x snap-mandatory overflow-x-auto rounded-3xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:h-[440px] sm:gap-2 sm:overflow-hidden ${classesGrade}`}
        >
          <button
            type="button"
            onClick={() => abrir(0)}
            aria-label={`Abrir foto 1 de ${total}`}
            className={`group relative w-full shrink-0 snap-center overflow-hidden bg-gray-100 ${classePrincipal}`}
          >
            <Foto
              key={lista[0]}
              src={fotoOtimizada(lista[0], 1440)}
              prioridade
              alt={titulo}
              contain={total === 1}
              className={
                total === 1
                  ? ""
                  : "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              }
            />
          </button>

          {secundarias.map((foto, i) => {
            const indice = i + 1;
            const ehUltimaComResto = indice === MAX_NA_GRADE - 1 && restantes > 0;
            const classeSecundaria = visiveisNaGrade === 4 && indice === 1 ? 'sm:col-span-2' : '';

            return (
              <button
                key={indice}
                type="button"
                onClick={() => abrir(indice)}
                aria-label={ehUltimaComResto ? `Ver todas as ${total} fotos` : `Abrir foto ${indice + 1} de ${total}`}
                className={`group relative w-full shrink-0 snap-center overflow-hidden bg-gray-100 ${indice >= MAX_NA_GRADE ? 'sm:hidden' : ''} ${classeSecundaria}`}
              >
                <Foto
                  key={foto}
                  src={fotoOtimizada(foto, 960)}
                  alt={`${titulo} - foto ${indice + 1}`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {ehUltimaComResto && (
                  <div className="absolute inset-0 hidden items-center justify-center bg-black/50 text-lg font-bold text-white transition-colors group-hover:bg-black/60 sm:flex">
                    +{restantes} {restantes === 1 ? "foto" : "fotos"}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* No celular só a foto principal aparece; este botão dá acesso ao resto. */}
        {total > 1 && (
          <button
            type="button"
            onClick={() => abrir(Math.min(indiceMobile, total - 1))}
            className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-3 py-2 text-xs font-bold text-grafite shadow-md backdrop-blur-sm transition-colors hover:bg-white"
          >
            <span className="mr-2 sm:hidden">{Math.min(indiceMobile + 1, total)} / {total} ·</span>Ver todas as fotos
          </button>
        )}
      </div>

      {lightboxAberto && (
        <Lightbox fotos={lista} titulo={titulo} indiceInicial={indiceInicial} onFechar={fechar} />
      )}
    </>
  );
}
