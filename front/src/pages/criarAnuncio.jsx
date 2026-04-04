import { useState } from 'react'

// 'function' no react é um componente
// 'function' estamos criando uma parte da interface (uma tela)
function CriarAnuncio () // componente inicia com letra maiúscula
{
    const [step, setStep] = useState(1)

    const estados = ['SELECIONE','AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

    // estados para armazenar os dados do produto
    // 'setTitulo' não armazena uma variavel, mas sim uma função 
    const [titulo, setTitulo] = useState("") 
    const [descricao, setDescricao] = useState("")
    const [categoria, setCategoria] = useState("")
    const [subcategoria, setSubcategoria] = useState("")

    // estado para armazenar as fotos do produto, inicialmente é um array vazio, pois ainda não tem fotos
    const [fotos, setFotos] = useState([])

   // estado para armazenar o endereço do produto, inicialmente é um objeto vazio, pois ainda não tem endereço 
    const [endereco, setEndereco] = useState({
        cep: "",
        rua: "",
        numero: "",
        complemento: "",
        semComplemento: false,
        bairro: "",
        cidade: "",
        estado: ""
    })

    function handleDetalhesSubmit (e) // 'e' é o evento de submit do formulario, essa função será chamada
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

    function handleFotosSubmit (e)
    {
        e.preventDefault()
        setStep(3)

        console.log('Fotos:', fotos)
    }

    function handleLocalizacaoSubmit (e)
    {
        e.preventDefault()
        setStep(4)

        console.log('Endereço:', endereco)
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

                        <form onSubmit = {handleDetalhesSubmit}>
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

                        <form onSubmit = {handleFotosSubmit}>
                            <input 
                                type='file' multiple
                                onChange = {(e) => 
                                {
                                    {/* Neste setFotos, recebe dentro do input os files atuais e junta com os anteriores, faz tipo um +=, '...' serve para espalhar os elementos do array */}
                                    setFotos(fotosAnteriores => [...fotosAnteriores, ...Array.from(e.target.files)])
                                }}
                            />

                            <button type='submit'>Continuar</button>
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
                {step === 3 &&
                    <div>
                        <h2>Localização</h2>

                        <form onSubmit={handleLocalizacaoSubmit}>
                            <label>CEP</label>
                            <input
                                placeholder='00000-000'
                                value={endereco.cep}
                                onChange = {(e) => setEndereco({...endereco, cep: e.target.value})}
                            />

                            <label>Rua</label>
                            <input
                                value={endereco.rua}
                                onChange = {(e) => setEndereco({...endereco, rua: e.target.value})}
                            />

                            <label>Número</label>
                            <input
                                placeholder='ex: 123'
                                value={endereco.numero}
                                onChange = {(e) => setEndereco({...endereco, numero: e.target.value})}
                            />

                            <label>Complemento</label>
                            <input
                                disabled={endereco.semComplemento} 
                                placeholder='ex: Casa, Apto, etc...'
                                value={endereco.complemento}
                                onChange = {(e) => setEndereco({...endereco, complemento: e.target.value})}
                            />

                            {/*'checked' serve para verificar se o checkbox está marcado , logo corresponde a dois estados apenas*/}
                            {/* condicao ? 'se verdadeiro' : 'se falso' */}
                            <input 
                                type='checkbox'
                                checked={endereco.semComplemento}
                                onChange={(e) => setEndereco({
                                    ...endereco, semComplemento: e.target.checked,
                                    complemento: e.target.checked ? '' : ''
                                })}
                            />
                            <label>Sem complemento</label>
                
                            <label>Bairro</label>
                            <input
                                value={endereco.bairro}
                                onChange = {(e) => setEndereco({...endereco, bairro: e.target.value})}
                            />

                            <label>Cidade</label>
                            <input
                                value={endereco.cidade}
                                onChange = {(e) => setEndereco({...endereco, cidade: e.target.value})}
                            />

                            <label>Estado</label>
                            <select
                                value={endereco.estado}
                                onChange = {(e) => setEndereco({...endereco, estado: e.target.value})}
                            >
                                {estados.map(estado =>(
                                    <option key = {estado} value={estado}>{estado}</option>
                                ))}
                            </select>

                            <button type='submit'>Continuar</button>
                        </form>
                    </div>
                }
            </>
        )
    }

export default CriarAnuncio //exportação do componente para ser usado em outros arquivos, como o 'App.jsx'