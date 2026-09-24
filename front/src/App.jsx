import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { PaginaInicial } from './pages/PaginaInicial';
import CriarAnuncio from './pages/criarAnuncio';
import { ResultadosBusca } from './pages/ResultadosBusca';
import { DetalhesProduto } from './pages/DetalhesProduto'; 
import PainelLocatario from './pages/PainelLocatario';
import PainelLocador from './pages/PainelLocador';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import EsqueceuSenha from './pages/EsqueceuSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import MeuPerfil from './pages/MeuPerfil';
import Configuracoes from './pages/Configuracoes';
import RotaPrivada from './components/RotaPrivada';
import { RotaAdmin } from './components/RotaAdmin';
import PainelAdmin from './pages/PainelAdmin';
import { NotificacaoProvider } from './context/NotificacaoContext';
import { Toast } from './components/Toast';
import { ConfirmacaoProvider} from './context/ConfirmacaoContext';
import { ModalConfirmacao} from './components/ModalConfirmacao';
import { Contato, FAQ, PoliticaPrivacidade, SobreNos, TermosDeUso } from './pages/Institucional';

import './index.css';

function RolarParaOTopo() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search]);

  return null;
}

function App() {
  return (
    <NotificacaoProvider>
      <Toast />
      <ConfirmacaoProvider>
        <ModalConfirmacao />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
        <RolarParaOTopo />
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
      </BrowserRouter>
      </ConfirmacaoProvider>
    </NotificacaoProvider>
  );
}

export default App;
