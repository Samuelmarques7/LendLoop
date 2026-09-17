import { createContext, useCallback, useContext, useState } from 'react';

const NotificacaoContext = createContext(null);

export function NotificacaoProvider({ children }) {
  const [notificacao, setNotificacao] = useState(null);

  const notificar = useCallback((texto, tipo = 'erro', duracaoMs = 4000) => {
    const id = Date.now();
    setNotificacao({ id, texto, tipo });

    setTimeout(() => {
      setNotificacao((atual) => (atual?.id === id ? null : atual));
    }, duracaoMs);
  }, []);

  const fecharNotificacao = useCallback(() => setNotificacao(null), []);

  return (
    <NotificacaoContext.Provider value={{ notificacao, notificar, fecharNotificacao }}>
      {children}
    </NotificacaoContext.Provider>
  );
}

export function useNotificacao() {
  const contexto = useContext(NotificacaoContext);
  if (!contexto) {
    throw new Error('useNotificacao precisa ser usado dentro de um NotificacaoProvider');
  }
  return contexto;
}