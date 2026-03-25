// 'function' no react é um componente
// 'function' estamos criando uma parte da interface (uma tela)
function CriarAnuncio () // componente inicia com letra maiúscula
{
    // Dentro do 'return' vai tudo que queremos mostrar na tela, como textos, imagens, etc.
    return (
        <div>
            <h1>Criar Anúncio</h1>
        </div>
    )
}

export default CriarAnuncio //exportação do componente para ser usado em outros arquivos, como o 'App.jsx'