import { useState, useRef } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

// 'function' no react é um componente
// 'function' estamos criando uma parte da interface (uma tela)
function CriarAnuncio () // componente inicia com letra maiúscula
{
    const [step, setStep] = useState(1)
    const steps = ['Detalhes', 'Fotos', 'Localização', 'Disponibilidade', 'Preços', 'Resumo']

    // estados para armazenar os dados do produto
    // 'setTitulo' não armazena uma variavel, mas sim uma função 
    const [titulo, setTitulo] = useState("") 
    const [descricao, setDescricao] = useState("")
    const [categoria, setCategoria] = useState("")
    const [subcategoria, setSubcategoria] = useState("")

    // estado para armazenar as fotos do produto, inicialmente é um array vazio, pois ainda não tem fotos
    const inputFotoRef = useRef(null)
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

    const estados = ['SELECIONE','AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
    
    const [disponivel, setDisponivel] = useState([])

    const [precos, setPrecos] = useState({
        precoPorDia: '',
        caucao: ''   
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

    function handleDisponibilidadeSubmit()
    {
        // sem 'e.preventDefault()', pois esse botão não está dentro de um formulário, logo não tem evento de submit'
        // como não há formulário, não recarrega a página, então não precisa do 'preventDefault'
        setStep(5)

        console.log('Disponibilidade:', disponivel)
    }

    function handlePrecosSubmit(e)
    {
        e.preventDefault()
        setStep(6)

        console.log('Preços e Condições:', precos)
    }

    function handlePublicar()
    {
        console.log('Anúncio publicado!', {
            titulo,
            descricao,
            categoria,
            subcategoria,
            fotos,
            endereco,
            disponivel,
            precos
        })
    }

    function handleRascunho()
    {
        console.log('Anúncio salvo como rascunho!', {
            titulo,
            descricao,
            categoria,
            subcategoria,
            fotos,
            endereco,
            disponivel,
            precos
        })
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
            <div className='max-w-3xl mx-auto px-6'>
                <div className='flex items-center justify-center mt-4'>
                    {steps.map((nome, index) => {
                        const complete = index + 1 < step
                        const active = index + 1 === step

                        return (
                            <div key={index} className='flex items-start'>
                                <div className='flex flex-col items-center min-w-16'>
                                
                                    {/*bolinha*/}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${active ? 'bg-verde-agua' : complete ? 'bg-verde-escuro' : 'bg-gray-300'}`}>
                                        {index + 1}
                                    </div>

                                    {/*nome*/}
                                    <span className={`text-xs font-medium mt-1 ${active ? 'text-verde-agua' : complete ? 'text-verde-escuro' : 'text-gray-400'}`}>
                                        {nome}
                                    </span>
                                </div>

                                {/*linha*/}
                                {index < steps.length - 1 && <div className={`w-16 h-1 mt-4 ${complete ? 'bg-verde-escuro' : 'bg-gray-300'}`}></div>}
                            </div>
                        )
                    })}
                </div>

                <h1 className='text-2xl font-bold text-grafite mt-6 mb-2'>Criar Novo Anúncio</h1>  {/* 'h1' título maior */}        
                    
                {step === 1 && 
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-6"> {/*gambiarra*/}
                        <h2 className = 'text-xl font-bold text-verde-escuro mb-6'>Detalhes do Anúncio</h2> {/* 'h2' título menor */}

                        <form onSubmit = {handleDetalhesSubmit}>
                            <div className = 'mb-4'>
                                <label className = 'label-field'>Título</label> {/* 'label' para descrever a que o campo se refere */}
                                <input
                                    className='input-default'
                                    placeholder="ex: Batedeira Arno" 
                                    value = {titulo}
                                    onChange = {(e) => setTitulo(e.target.value)}
                                />
                            </div>

                            <div className = 'mb-4'>
                                <label className = 'label-field'>Descrição</label>
                                <textarea 
                                    className='input-default'
                                    placeholder="Descreva seu item em detalhes...." 
                                    value = {descricao}
                                    onChange = {(e) => setDescricao(e.target.value)}
                                />
                            </div>

                            <div className = 'flex gap-4'>
                                <div className='flex-1 mb-4'>
                                    <label className = 'label-field'>Categoria</label>
                                    <select
                                        className='input-default'
                                        value = {categoria}
                                        onChange = {(e) => setCategoria(e.target.value)}
                                    >
                                    <option>Selecione</option>
                                    <option value = 'ferramentas'>Ferramentas</option>
                                    <option value = 'eletronicos'>Eletrônicos</option>
                                    </select>
                                </div>
                                <div className='flex-1 mb-4'>
                                    <label className = 'label-field'>Subcategoria</label>
                                        <select
                                            className='input-default'
                                            value = {subcategoria}
                                            onChange = {(e) => setSubcategoria(e.target.value)}
                                        >
                                        <option>Selecione</option>
                                    </select>
                                </div>
                            </div>
                    
                            {/* 'type=submit', pois submit é a convenção para botões de envio de formulario  */}        
                            <div className = 'flex justify-end mt-6'>
                                <button type="submit" className='btn-next'>Próximo</button>
                            </div>
                        </form>
                    </div>
                }
                {step === 2 && 
                    <div>
                        <h2 className = 'text-xl font-bold text-verde-escuro mb-6'>Fotos do Anúncio</h2>

                        <form onSubmit = {handleFotosSubmit}>
                            {/* input escondido */}
                            <input 
                                type='file' 
                                multiple
                                ref={inputFotoRef}
                                className='hidden'
                                onChange={(e) => {
                                    setFotos(fotosAnteriores => [...fotosAnteriores, ...Array.from(e.target.files)])
                                }}
                            />

                            <div className="border-2 border-dashed border-verde-agua rounded-2xl p-4 transition-all">
    
                                {/* grid de fotos */}
                                {fotos.length > 0 && (
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {fotos.map((foto, indice) => (
                                            <div key={indice} className="relative">
                                                <img 
                                                    src={URL.createObjectURL(foto)} 
                                                    className="w-full h-32 object-cover rounded-xl"
                                                />
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        removerFoto(indice)
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                                                >
                                                    X
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* botão de adicionar */}
                                <div 
                                    onClick={() => inputFotoRef.current.click()}
                                    className="flex flex-col items-center justify-center py-8 cursor-pointer hover:bg-verde-agua/10 rounded-xl transition-all"
                                >
                                    <p className="text-verde-escuro font-semibold">
                                        {fotos.length > 0 ? '+ Adicionar mais fotos' : 'Clique para adicionar fotos'}
                                    </p>
                                    <p className="text-gray-400 text-sm mt-1">PNG, JPG até 5MB</p>
                                </div>
                            </div>
                            
                            <div className = 'flex justify-between mt-6'>
                                <button onClick={() => setStep(step - 1)} className='btn-back'>↩ Voltar</button>
                                <button type='submit' className='btn-next'>Próximo</button>
                            </div>
                        </form> 
                    </div>
                }
                {step === 3 &&
                    <div>
                        <h2 className = 'text-xl font-bold text-verde-escuro mb-6'>Localização</h2>

                        <form onSubmit={handleLocalizacaoSubmit}>
                            <div className = 'mb-4 max-w-sm'>
                                <label className = 'label-field'>CEP</label>
                                <input
                                    className='input-default'
                                    placeholder='00000-000'
                                    value={endereco.cep}
                                    onChange = {(e) => {
                                        setEndereco({...endereco, cep: e.target.value})

                                        if(e.target.value.length === 8)
                                        {
                                            fetch(`https://brasilapi.com.br/api/cep/v1/${e.target.value}`)
                                                .then(retorno => retorno.json())
                                                .then(dados =>
                                                    {
                                                        setEndereco({
                                                            ...endereco,
                                                            rua: dados.street,
                                                            bairro: dados.neighborhood,
                                                            cidade: dados.city,
                                                            estado: dados.state
                                                        })
                                                    })
                                        }
                                    }}
                                />
                            </div>

                            <div className = 'mb-4'>
                                <label className = 'label-field'>Rua</label>
                                <input
                                    className='input-default'
                                    value={endereco.rua}
                                    onChange = {(e) => setEndereco({...endereco, rua: e.target.value})}
                                />
                            </div>

                            <div className = 'flex gap-4 mb-4'>
                                <div className = 'flex-1'>
                                    <label className = 'label-field'>Número</label>
                                    <input
                                        className='input-default'
                                        placeholder='ex: 123'
                                        value={endereco.numero}
                                        onChange = {(e) => setEndereco({...endereco, numero: e.target.value})}
                                    />
                                </div>

                                <div className = 'flex-1'>
                                    <label className = 'label-field'>Complemento</label>
                                    <input
                                        disabled={endereco.semComplemento} 
                                        className='input-default'
                                        placeholder='ex: Casa, Apto, etc...'
                                        value={endereco.complemento}
                                        onChange = {(e) => setEndereco({...endereco, complemento: e.target.value})}
                                    />
                                
                                    {/*'checked' serve para verificar se o checkbox está marcado , logo corresponde a dois estados apenas*/}
                                    {/* condicao ? 'se verdadeiro' : 'se falso' */}
                                    <div className = 'flex items-center gap-2 mt-2'>    
                                        <input 
                                            type='checkbox'
                                            className="w-5 h-5 accent-verde-agua cursor-pointer"
                                            checked={endereco.semComplemento}
                                            onChange={(e) => setEndereco({
                                                ...endereco, semComplemento: e.target.checked,
                                                complemento: e.target.checked ? '' : ''
                                            })}
                                        />
                                        <label className = 'label-field'>Sem complemento</label>
                                    </div>  
                                </div>
                            </div>

                            <div className = 'flex gap-4 mb-4'>
                                <div className = 'flex-1'>
                                    <label className = 'label-field'>Bairro</label>
                                    <input
                                        className='input-default'
                                        value={endereco.bairro}
                                        onChange = {(e) => setEndereco({...endereco, bairro: e.target.value})}
                                    />
                                </div>

                                <div className = 'flex-1'>
                                    <label className = 'label-field'>Cidade</label>
                                    <input
                                        className='input-default'
                                        value={endereco.cidade}
                                        onChange = {(e) => setEndereco({...endereco, cidade: e.target.value})}
                                    />
                                </div>

                                <div className = 'flex-1'>
                                    <label className = 'label-field'>Estado</label>
                                    <select
                                        className='input-default'
                                        value={endereco.estado}
                                        onChange = {(e) => setEndereco({...endereco, estado: e.target.value})}
                                    >
                                        {estados.map(estado =>(
                                            <option key = {estado} value={estado}>{estado}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className = 'flex justify-between mt-6'>
                                <button onClick={() => setStep(step - 1)} className='btn-back'>↩ Voltar</button>
                                <button type='submit' className='btn-next'>Próximo</button>
                            </div>    
                        </form>
                    </div>
                }
                {step === 4 &&
                    <div>
                        <h2 className = 'text-xl font-bold text-verde-escuro mb-6'>Disponibilidade</h2>

                        <div className="flex justify-center my-4">
                            <DayPicker
                                mode='multiple'
                                selected={disponivel}
                                onSelect={setDisponivel}
                            />
                        </div>

                        {console.log(disponivel)}

                        <p className="text-center text-verde-agua font-semibold mb-4">
                            {disponivel.length} {disponivel.length === 1 ? 'dia selecionado' : 'dias selecionados'}
                        </p>

                        <div className = 'flex justify-between mt-6'>
                            <button onClick={() => setStep(step - 1)} className='btn-back'>↩ Voltar</button>
                            <button onClick={handleDisponibilidadeSubmit} className='btn-next'>Próximo</button>                    
                        </div>
                    </div>
                }
                {step === 5 &&
                    <div>
                        <form onSubmit={handlePrecosSubmit}>
                            <h2 className='text-xl font-bold text-verde-escuro mb-6'>Preços e Condições</h2>

                            <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                    <label className="label-field">Preço por dia</label>
                                    <input
                                        type='number'
                                        className='input-default'
                                        placeholder='0,00'
                                        value={precos.precoPorDia}
                                        onChange={(e) => setPrecos({...precos, precoPorDia: e.target.value})}
                                    />
                                </div>

                                <div className="flex-1">
                                    <label className="label-field">Caução (Opcional)</label>
                                    <input
                                        type='number'
                                        className='input-default'
                                        placeholder='0,00'
                                        value={precos.caucao}
                                        onChange={(e) => setPrecos({...precos, caucao: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className='flex justify-between mt-6'>
                                <button onClick={() => setStep(step - 1)} className='btn-back'>↩ Voltar</button>
                                <button type='submit' className='btn-next'>Concluir</button>
                            </div>
                        </form>
                    </div>
                }
                {step === 6 &&
                    <div>
                        <h2 className='text-xl font-bold text-verde-escuro mb-6'>Resumo do Anúncio</h2>

                        <div className="space-y-3 mb-8">
                            <p className="text-grafite"><strong>Produto:</strong> {titulo}</p>
                            <p className="text-grafite"><strong>Descrição:</strong> {descricao}</p>
                            <p className="text-grafite"><strong>Categoria:</strong> {categoria} / {subcategoria}</p>
                            <p className="text-grafite"><strong>Fotos:</strong> {fotos.length} adicionadas</p>
                            <p className="text-grafite"><strong>Endereço:</strong> {endereco.rua}, {endereco.numero}</p>        
                        </div>
                    
                        <div className="flex justify-between items-center">
                            <button onClick={() => setStep(step - 1)} className='btn-back'>↩ Voltar</button>
                        <div className="flex gap-4">
                            <button onClick={handleRascunho} className='bg-transparent border-2 border-verde-agua text-verde-agua hover:text-verde-escuro hover:border-verde-escuro px-6 py-2 rounded-lg font-bold transition-all cursor-pointer uppercase tracking-widest'>Salvar como rascunho</button>
                            <button onClick={handlePublicar} className='btn-next'>Publicar Anúncio</button>
                        </div>
                    </div>
                </div>
            }
        </div>
    </>
    )
}

export default CriarAnuncio //exportação do componente para ser usado em outros arquivos, como o 'App.jsx'