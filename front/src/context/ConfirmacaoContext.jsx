import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ConfirmacaoContext = createContext(null);

export function ConfirmacaoProvider({ children }) {
  const [pedido, setPedido] = useState(null);
  const resolverRef = useRef(null);

  const confirmar = useCallback((opcoes) => {
    // Aceita tanto confirmar('texto') quanto confirmar({ titulo, mensagem, ... })
    const config = typeof opcoes === 'string' ? { mensagem: opcoes } : opcoes;

    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setPedido({
        titulo: config.titulo || 'Confirmar ação',
        mensagem: config.mensagem,
        textoConfirmar: config.textoConfirmar || 'Confirmar',
        textoCancelar: config.textoCancelar || 'Cancelar',
        variante: config.variante || 'padrao', // 'padrao' | 'perigo'
      });
    });
  }, []);

  const responder = useCallback((resultado) => {
    resolverRef.current?.(resultado);
    resolverRef.current = null;
    setPedido(null);
  }, []);

  return (
    <ConfirmacaoContext.Provider value={{ pedido, confirmar, responder }}>
      {children}
    </ConfirmacaoContext.Provider>
  );
}

export function useConfirmacao() {
  const contexto = useContext(ConfirmacaoContext);
  if (!contexto) {
    throw new Error('useConfirmacao precisa ser usado dentro de um ConfirmacaoProvider');
  }
  // Retorna direto a função confirmar, que é o que as páginas vão usar no dia a dia
  return contexto.confirmar;
}

// Uso interno do <ModalConfirmacao />, que precisa do pedido atual e de como responder
export function useConfirmacaoInterna() {
  const contexto = useContext(ConfirmacaoContext);
  if (!contexto) {
    throw new Error('useConfirmacaoInterna precisa ser usado dentro de um ConfirmacaoProvider');
  }
  return contexto;
}