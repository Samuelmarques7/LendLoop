import { Link } from 'react-router-dom';
import logo from '../assets/logo-painel-transparente.webp';

export function RecuperacaoLayout({ children }) {
  return (
    <main className="relative flex min-h-screen justify-center overflow-hidden bg-[#f7fafb] px-5 py-8 sm:px-8">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-verde-agua via-ciano to-azul-oceano" />
      <div className="absolute left-1/2 top-[-18rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-ciano/5 blur-3xl" />

      <div className="relative w-full max-w-lg">
        <header className="mb-8 flex justify-center sm:mb-10">
          <Link to="/" aria-label="Ir para a página inicial">
            <img src={logo} alt="LendLoop" className="h-12 w-auto object-contain" />
          </Link>
        </header>

        <section className="rounded-[2rem] border border-gray-100 bg-white p-7 shadow-xl shadow-verde-escuro/5 sm:p-10">
          {children}
        </section>

        <p className="mt-7 text-center text-xs text-grafite/45">© LendLoop · Acesso seguro à sua conta</p>
      </div>
    </main>
  );
}
