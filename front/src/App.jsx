import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

import './index.css';

function App() {
  return (
    <BrowserRouter>
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;