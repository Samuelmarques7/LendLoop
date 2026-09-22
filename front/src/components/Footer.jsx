import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 py-8 px-8 bg-white mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-azul-oceano">
          <Link to="/sobre" className="hover:text-verde-escuro transition-colors">Sobre Nós</Link>
          <Link to="/faq" className="hover:text-verde-escuro transition-colors">FAQ</Link>
          <Link to="/termos" className="hover:text-verde-escuro transition-colors">Termos de Uso</Link>
          <Link to="/privacidade" className="hover:text-verde-escuro transition-colors">Política de Privacidade</Link>
          <Link to="/contato" className="hover:text-verde-escuro transition-colors">Contato</Link>
        </div>
        <p className="text-xs text-gray-400">© 2025 LendLoop. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
