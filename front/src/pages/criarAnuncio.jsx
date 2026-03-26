import { useState } from 'react'

// 'function' no react é um componente
// 'function' estamos criando uma parte da interface (uma tela)
function CriarAnuncio () // componente inicia com letra maiúscula
{
    // setTitulo não armazena uma variavel, mas sim uma função 
    const [titulo, setTitulo] = useState("") 
    const [descricao, setDescricao] = useState("")
    const [categoria, setCategoria] = useState("")
    const [subcategoria, setSubcategoria] = useState("")

    // Dentro do 'return' vai tudo que queremos mostrar na tela, como textos, imagens, etc.
    return (
        <div>   
            <h1>Criar Novo Anúncio</h1> {/* 'h1' título maior */}
            <h2>Detalhes do Anúncio</h2> {/* 'h2' título menor */}

            <label>Título</label> {/* 'label' para descrever a que o campo se refere */}
            <input
                placeholder="ex: Batedeira Arno" 
                value = {titulo}
                onChange = {(e) => setTitulo(e.target.value)}
            />

            <label>Descrição</label>
            <textarea 
                placeholder="Descreva seu item em detalhes...." 
                value = {descricao}
                onChange = {(e) => setDescricao(e.target.value)}
            />
            
            <label>Categoria</label>
            <select
                value = {categoria}
                onChange = {(e) => setCategoria(e.target.value)}
            >
                <option>Selecione</option>
                <option>Ferramentas</option>
                <option>Eletrônicos</option>
            </select>

            <label>Subcategoria</label>
            <select
                value = {subcategoria}
                onChange = {(e) => setSubcategoria(e.target.value)}>
                <option>Selecione</option>              
            </select>
            
            <button>Continuar</button>
            
        </div>
    )
}

export default CriarAnuncio //exportação do componente para ser usado em outros arquivos, como o 'App.jsx'