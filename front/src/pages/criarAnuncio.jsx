// 'function' no react é um componente
// 'function' estamos criando uma parte da interface (uma tela)
function CriarAnuncio () // componente inicia com letra maiúscula
{
    // Dentro do 'return' vai tudo que queremos mostrar na tela, como textos, imagens, etc.
    return (
        <div>   
            <h1>Criar Novo Anúncio</h1> {/* 'h1' título maior */}
            <h2>Detalhes do Anúncio</h2> {/* 'h2' título menor */}

            <label>Título</label> {/* 'label' para descrever a que o campo se refere */}
            <input placeholder="ex: Batedeira Arno" /> 

            <label>Descrição</label>
            <textarea placeholder="Descreva seu item em detalhes...." />
            
            <label>Categoria</label>
            <select>
                <option>Selecione</option>
                <option>Ferramentas</option>
                <option>Eletrônicos</option>
            </select>

            <label>Subcategoria</label>
            <select>
                <option>Selecione</option>              
            </select>
            
            <button>Continuar</button>
            
        </div>
    )
}

export default CriarAnuncio //exportação do componente para ser usado em outros arquivos, como o 'App.jsx'