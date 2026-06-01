import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PaginaInicial } from './pages/PaginaInicial';
import CriarAnuncio from './pages/criarAnuncio';
import { ResultadosBusca } from './pages/ResultadosBusca';
import { DetalhesProduto } from './pages/DetalhesProduto'; 
import PainelLocador from './pages/PainelLocador';
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;