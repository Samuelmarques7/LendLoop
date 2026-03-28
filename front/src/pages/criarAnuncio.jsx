import { useState } from 'react'

// 'function' no react é um componente
// 'function' estamos criando uma parte da interface (uma tela)
function CriarAnuncio () // componente inicia com letra maiúscula
{
    const [step, setStep] = useState(1)

    // estados para armazenar os dados do produto
    // 'setTitulo' não armazena uma variavel, mas sim uma função 
    const [titulo, setTitulo] = useState("") 
    const [descricao, setDescricao] = useState("")
    const [categoria, setCategoria] = useState("")
    const [subcategoria, setSubcategoria] = useState("")

    // estado para armazenar as fotos do produto, inicialmente é um array vazio, pois ainda não tem fotos
    const [fotos, setFotos] = useState([])

    function handleSubmit (e) // 'e' é o evento de submit do formulario, essa função será chamada
    {
        // 'preventDefault' faz com que a página não recarregue
        e.preventDefault()
        setStep(2)

        console.log('Dados do formulário:')
        console.log('Título:', titulo)
        console.log('Descrição:', descricao)
        console.log('Categoria:', categoria)
        console.log('Subcategoria:', subcategoria)
    }

    // função para manter todas as fotos cujo indice for diferente do indice da foto que queremos remover
    // revome a foto do array, função que recebe como parametro o indice da foto a ser removida
    function removerFoto(index)
    {
        setFotos(fotos.filter((foto, i) => i !== index))
    }

    // Dentro do 'return' vai tudo que queremos mostrar na tela, como textos, imagens, etc.
    return (  
        <>
            <h1>Criar Novo Anúncio</h1>  {/* 'h1' título maior */}        
                {step === 1 && 
                    <div>
                        <h2>Detalhes do Anúncio</h2> {/* 'h2' título menor */}

                        <form onSubmit = {handleSubmit}>
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
                                <option value = 'ferramentas'>Ferramentas</option>
                                <option value = 'eletronicos'>Eletrônicos</option>
                            </select>

                            <label>Subcategoria</label>
                            <select
                                value = {subcategoria}
                                onChange = {(e) => setSubcategoria(e.target.value)}
                            >
                                <option>Selecione</option>
                            </select>
                
                            {/* 'type=submit', pois submit é a convenção para botões de envio de formulario  */}
                            <button type="submit">Continuar</button>
                        </form>
                    </div>
                }
                {step === 2 && 
                    <div>
                        <h2>Fotos do Anúncio</h2>

                        <form>
                            <input 
                                type='file' multiple
                                onChange = {(e) => 
                                {
                                    {/* Neste setFotos, recebe dentro do input os files atuais e junta com os anteriores, faz tipo um +=, '...' serve para espalhar os elementos do array */}
                                    setFotos(fotosAnteriores => [...fotosAnteriores, ...Array.from(e.target.files)])
                                    console.log(fotos)
                                }}
                            />

                            <button>Continuar</button>
                        </form>

                        {/* Exibe as fotos selecionadas */}
                        {/* '=>' é um arrow function, é uma forma resumida de escrever funções em JavaScript */}
                        {/* 'map' funciona como um loop, tipo um for */}
                        {fotos.map((foto, indice) => (
                            <div>
                                <img src = {URL.createObjectURL(foto)}/>
                                <button onClick={() => removerFoto(indice)}>X</button>
                            </div>
                        ))}
                        

                    </div>
                }
            </>
        )
    }

export default CriarAnuncio //exportação do componente para ser usado em outros arquivos, como o 'App.jsx'