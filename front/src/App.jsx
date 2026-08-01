import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PaginaInicial } from './pages/PaginaInicial';
import CriarAnuncio from './pages/criarAnuncio';
import { ResultadosBusca } from './pages/ResultadosBusca';
import { DetalhesProduto } from './pages/DetalhesProduto'; 
import PainelLocador from './pages/PainelLocador';
import Cadastro from './pages/Cadastro';
import Login from './pages/Login';
import EsqueceuSenha from './pages/EsqueceuSenha';

import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PaginaInicial />} />
        <Route path="/busca" element={<ResultadosBusca />} />
        <Route path="/criar-anuncio" element={<CriarAnuncio />} />
        <Route path="/produto/:id" element={<DetalhesProduto />} />
        <Route path="/painelLocador" element={<PainelLocador />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/login" element={<Login />} />
        <Route path="/esqueceu-senha" element={<EsqueceuSenha />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;