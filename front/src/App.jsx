import CriarAnuncio from "./pages/criarAnuncio" // importando componente para ser usado essa página
import { ResultadosBusca } from './pages/ResultadosBusca';
import './index.css';

function App()
{
  return (
    <div>
      <CriarAnuncio /> {/* mostra essa página na tela, ou seja, a page de criar anuncio   */}
       <ResultadosBusca />
    </div>
  )
}
export default App // exportação deste componente para ser usado de maneira externa
