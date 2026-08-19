export function Footer() {
  return (
    <footer className="border-t border-gray-200 py-8 px-8 bg-white mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-6 text-sm text-azul-oceano">
          <a href="#" className="hover:text-verde-escuro transition-colors">Sobre Nós</a>
          <a href="#" className="hover:text-verde-escuro transition-colors">FAQ</a>
          <a href="#" className="hover:text-verde-escuro transition-colors">Termos de Uso</a>
          <a href="#" className="hover:text-verde-escuro transition-colors">Política de Privacidade</a>
          <a href="#" className="hover:text-verde-escuro transition-colors">Contato</a>
        </div>
        <p className="text-xs text-gray-400">© 2025 LendLoop. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}