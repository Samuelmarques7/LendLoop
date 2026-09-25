import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { PaginaInicial } from './pages/PaginaInicial';
import RotaPrivada from './components/RotaPrivada';
import { RotaAdmin } from './components/RotaAdmin';
import { NotificacaoProvider } from './context/NotificacaoContext';
import { Toast } from './components/Toast';
import { ConfirmacaoProvider} from './context/ConfirmacaoContext';
import { ModalConfirmacao} from './components/ModalConfirmacao';

const CriarAnuncio = lazy(() => import('./pages/criarAnuncio'));
const ResultadosBusca = lazy(() => import('./pages/ResultadosBusca').then((modulo) => ({ default: modulo.ResultadosBusca })));
const DetalhesProduto = lazy(() => import('./pages/DetalhesProduto').then((modulo) => ({ default: modulo.DetalhesProduto })));
const PainelLocatario = lazy(() => import('./pages/PainelLocatario'));
const PainelLocador = lazy(() => import('./pages/PainelLocador'));
const Cadastro = lazy(() => import('./pages/Cadastro'));
const Login = lazy(() => import('./pages/Login'));
const EsqueceuSenha = lazy(() => import('./pages/EsqueceuSenha'));
const RedefinirSenha = lazy(() => import('./pages/RedefinirSenha'));
const MeuPerfil = lazy(() => import('./pages/MeuPerfil'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));
const PainelAdmin = lazy(() => import('./pages/PainelAdmin'));
const SobreNos = lazy(() => import('./pages/Institucional').then((modulo) => ({ default: modulo.SobreNos })));
const FAQ = lazy(() => import('./pages/Institucional').then((modulo) => ({ default: modulo.FAQ })));
const TermosDeUso = lazy(() => import('./pages/Institucional').then((modulo) => ({ default: modulo.TermosDeUso })));
const PoliticaPrivacidade = lazy(() => import('./pages/Institucional').then((modulo) => ({ default: modulo.PoliticaPrivacidade })));
const Contato = lazy(() => import('./pages/Institucional').then((modulo) => ({ default: modulo.Contato })));

import './index.css';

function RolarParaOTopo() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search]);

  return null;
}

function CarregandoPagina() {
  return (
    <div className="grid min-h-[55vh] place-items-center bg-[#f7fafb]" role="status" aria-live="polite">
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-ciano/20 border-t-ciano" aria-label="Carregando página" />
    </div>
  );
}

function App() {
  return (
    <NotificacaoProvider>
      <Toast />
      <ConfirmacaoProvider>
        <ModalConfirmacao />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
        <RolarParaOTopo />
        <Suspense fallback={<CarregandoPagina />}>
        <Routes>
          <Route path="/" element={<PaginaInicial />} />
          <Route path="/busca" element={<ResultadosBusca />} />
          <Route path="/criar-anuncio" element={<RotaPrivada><CriarAnuncio /></RotaPrivada>} />
          <Route path="/produto/:id" element={<DetalhesProduto />} />
          <Route path="/painellocatario" element={<RotaPrivada><PainelLocatario /></RotaPrivada>} />
          <Route path="/painelLocador" element={<RotaPrivada><PainelLocador /></RotaPrivada>} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/meu-perfil" element={<RotaPrivada><MeuPerfil /></RotaPrivada>} />
          <Route path="/configuracoes" element={<RotaPrivada><Configuracoes /></RotaPrivada>} />
          <Route path="/usuario/:id" element={<MeuPerfil />} />
          <Route path="/sobre" element={<SobreNos />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/termos" element={<TermosDeUso />} />
          <Route path="/privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/contato" element={<Contato />} />

          {/* Rotas Protegidas do Administrador (Padrão Outlet) */}
          <Route element={<RotaAdmin />}>
            <Route path="/paineladmin" element={<PainelAdmin />} />
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
      </ConfirmacaoProvider>
    </NotificacaoProvider>
  );
}

export default App;
