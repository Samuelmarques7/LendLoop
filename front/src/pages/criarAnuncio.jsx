import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { useNavigate } from 'react-router-dom'
import 'react-day-picker/dist/style.css'
import { apiRequest } from '../services/api'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

// 'function' no react é um componente
// 'function' estamos criando uma parte da interface (uma tela)
function CriarAnuncio () // componente inicia com letra maiúscula
{
    const navigate = useNavigate()
    const usuarioLogado = JSON.parse(localStorage.getItem('dadosUsuario'))

    useEffect(() => {
        if (!usuarioLogado) {
            navigate('/login')
        }
    }, [])

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
        caucao: '',
        exigirCaucao: false,
        horarioRetirada: '09:00',
        horarioDevolucao: '17:00'
    })

    const [mensagem, setMensagem] = useState(null)

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

    async function handlePublicar()
    {
        try {
            const data = await apiRequest('/api/anuncios', {
                method: 'POST',
                body: {
                    titulo,
                    descricao,
                    categoria,
                    subcategoria,
                    fotos: [],
                    endereco,
                    disponivel,
                    precos,
                    status: 'publicado',
                    locador: usuarioLogado.id
                }
            });

        setMensagem({ tipo: 'sucesso', texto: 'Anúncio publicado com sucesso!' });

        setTimeout(() => {
            navigate('/painelLocador');
        }, 1000);
        } catch (error) {
            setMensagem({ tipo: 'erro', texto: error.message });
        }
    }

    async function handleRascunho()
    {
        try {
            const data = await apiRequest('/api/anuncios', {
                method: 'POST',
                body: {
                    titulo,
                    descricao,
                    categoria,
                    subcategoria,
                    fotos: [],
                    endereco,
                    disponivel,
                    precos,
                    status: 'rascunho',
                    locador: usuarioLogado.id
                }
            });

            setMensagem({ tipo: 'sucesso', texto: 'Anúncio salvo como rascunho!' });

            setTimeout(() => {
                navigate('/painelLocador');
            }, 1000);
        } catch (error) {
            setMensagem({ tipo: 'erro', texto: error.message });
        }
    }
    // função para manter todas as fotos cujo indice for diferente do indice da foto que queremos remover
    // revome a foto do array, função que recebe como parametro o indice da foto a ser removida
    function removerFoto(index)
    {
        setFotos(fotos.filter((foto, i) => i !== index))
    }

    // Dentro do 'return' vai tudo que queremos mostrar na tela, como textos, imagens, etc.
    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
            <Header />
            <div className='max-w-4xl mx-auto px-6 w-full flex-1 pt-10 pb-16'>

                {/* STEPS - mesma lógica de antes, só com as cores hex usadas no ResultadosBusca */}
                <div className='flex items-center justify-center mb-4'>
                    {steps.map((nome, index) => {
                        const complete = index + 1 < step
                        const active = index + 1 === step

                        return (
                            <div key={index} className='flex items-start'>
                                <div className='flex flex-col items-center min-w-16'>
                                
                                    {/*bolinha*/}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all ${active ? 'bg-[#00B795]' : complete ? 'bg-[#1A1A1A]' : 'bg-gray-200'}`}>
                                        {index + 1}
                                    </div>

                                    {/*nome*/}
                                    <span className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 ${active ? 'text-[#00B795]' : complete ? 'text-[#1A1A1A]' : 'text-gray-300'}`}>
                                        {nome}
                                    </span>
                                </div>

                                {/*linha*/}
                                {index < steps.length - 1 && <div className={`w-12 h-0.5 mt-4 transition-all ${complete ? 'bg-[#1A1A1A]' : 'bg-gray-200'}`}></div>}
                            </div>
                        )
                    })}
                </div>

                <div className='mb-2'>
                    <h1 className='text-2xl font-bold text-[#1A1A1A]'>Criar Novo Anúncio</h1>  {/* 'h1' título maior */}
                    <p className='text-gray-400 text-sm mt-1'>Preencha as informações para anunciar seu item</p>
                </div>
                    
                {step === 1 && 
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mt-6"> {/*gambiarra*/}
                        <div className='mb-6'>
                            <h2 className = 'text-xl font-bold text-[#1A1A1A]'>Detalhes do Anúncio</h2> {/* 'h2' título menor */}
                            <p className='text-gray-400 text-sm mt-1'>Conte para os locatários o que você está oferecendo</p>
                        </div>

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
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mt-6">
                        <div className='mb-6'>
                            <h2 className = 'text-xl font-bold text-[#1A1A1A]'>Fotos do Anúncio</h2>
                            <p className='text-gray-400 text-sm mt-1'>Fotos claras aumentam suas chances de locação</p>
                        </div>

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

                            <div className="border-2 border-dashed border-gray-200 hover:border-[#00B795] rounded-2xl p-4 transition-all">
    
                                {/* grid de fotos */}
                                {fotos.length > 0 ? (
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
                                                    className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-sm hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                                                >
                                                    X
                                                </button>
                                            </div>
                                        ))}
                                        {/* slots vazios restantes, no padrão do wireframe */}
                                        {Array.from({ length: Math.max(0, 6 - fotos.length) }).map((_, i) => (
                                            <div
                                                key={`vazio-${i}`}
                                                onClick={() => inputFotoRef.current.click()}
                                                className="h-32 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xl cursor-pointer hover:border-[#00B795] hover:text-[#00B795] transition-all"
                                            >
                                                +
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <div
                                                key={`vazio-${i}`}
                                                onClick={() => inputFotoRef.current.click()}
                                                className="h-32 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xl cursor-pointer hover:border-[#00B795] hover:text-[#00B795] transition-all"
                                            >
                                                +
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* texto de apoio abaixo do grid */}
                                <div 
                                    onClick={() => inputFotoRef.current.click()}
                                    className="flex flex-col items-center justify-center py-4 cursor-pointer hover:bg-[#00B795]/5 rounded-xl transition-all"
                                >
                                    <p className="text-[#006861] font-semibold text-sm">
                                        {fotos.length > 0 ? '+ Adicionar mais fotos' : 'Clique em qualquer quadro para adicionar fotos'}
                                    </p>
                                    <p className="text-gray-400 text-xs mt-1">PNG, JPG até 5MB</p>
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
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mt-6">
                        <div className='mb-6'>
                            <h2 className = 'text-xl font-bold text-[#1A1A1A]'>Localização</h2>
                            <p className='text-gray-400 text-sm mt-1'>Onde o locatário poderá retirar o item</p>
                        </div>

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
                                            className="w-5 h-5 accent-[#00B795] cursor-pointer"
                                            checked={endereco.semComplemento}
                                            onChange={(e) => setEndereco({
                                                ...endereco, semComplemento: e.target.checked,
                                                complemento: e.target.checked ? '' : ''
                                            })}
                                        />
                                        <label className = 'label-field mb-0'>Sem complemento</label>
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

                            {/* Mapa - placeholder visual, integração real de mapa fica pra depois */}
                            <div className='mb-4'>
                                <label className='label-field'>Localização no mapa</label>
                                <div className="relative h-56 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex items-center justify-center">
                                    <div className="absolute inset-0 opacity-40" style={{
                                        backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
                                        backgroundSize: '24px 24px'
                                    }}></div>
                                    <div className="relative flex flex-col items-center gap-2 text-center px-4">
                                        <div className="w-10 h-10 rounded-full bg-[#00B795] flex items-center justify-center shadow-lg">
                                            <div className="w-3 h-3 rounded-full bg-white"></div>
                                        </div>
                                        <p className="text-sm font-bold text-[#1A1A1A]">
                                            {endereco.rua ? `${endereco.rua}, ${endereco.cidade || ''}` : 'Preencha o endereço acima'}
                                        </p>
                                        <p className="text-xs text-gray-400">Arraste o pin para ajustar a localização exata</p>
                                    </div>
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
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mt-6">
                        <div className='mb-6'>
                            <h2 className = 'text-xl font-bold text-[#1A1A1A]'>Disponibilidade</h2>
                            <p className='text-gray-400 text-sm mt-1'>Selecione os dias em que o item estará disponível</p>
                        </div>

                        <div className="flex justify-center my-4 bg-gray-50/50 rounded-2xl border border-gray-100 p-6">
                            <DayPicker
                                mode='multiple'
                                selected={disponivel}
                                onSelect={setDisponivel}
                                classNames={{
                                    day_selected: 'bg-[#00B795] text-white rounded-lg',
                                    day_today: 'font-bold text-[#00639E]'
                                }}
                            />
                        </div>

                        {console.log(disponivel)}

                        <p className="text-center text-[#00B795] font-semibold mb-4">
                            {disponivel.length} {disponivel.length === 1 ? 'dia selecionado' : 'dias selecionados'}
                        </p>

                        <div className = 'flex justify-between mt-6'>
                            <button onClick={() => setStep(step - 1)} className='btn-back'>↩ Voltar</button>
                            <button onClick={handleDisponibilidadeSubmit} className='btn-next'>Próximo</button>                    
                        </div>
                    </div>
                }
                {step === 5 &&
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mt-6">
                        <form onSubmit={handlePrecosSubmit}>
                            <div className='mb-6'>
                                <h2 className='text-xl font-bold text-[#1A1A1A]'>Preços e Condições</h2>
                                <p className='text-gray-400 text-sm mt-1'>Defina quanto vai cobrar pela locação</p>
                            </div>

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

                            <div className='flex items-center gap-2 mb-6'>
                                <input
                                    type='checkbox'
                                    className="w-5 h-5 accent-[#00B795] cursor-pointer"
                                    checked={precos.exigirCaucao}
                                    onChange={(e) => setPrecos({...precos, exigirCaucao: e.target.checked})}
                                />
                                <label className='label-field mb-0'>Exigir caução</label>
                            </div>

                            <div className='border-t border-gray-100 pt-6 mb-2'>
                                <h3 className='text-sm font-bold text-[#1A1A1A] uppercase tracking-wide mb-4'>Regras de Reserva</h3>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="label-field">Horário de retirada</label>
                                        <input
                                            type='time'
                                            className='input-default'
                                            value={precos.horarioRetirada}
                                            onChange={(e) => setPrecos({...precos, horarioRetirada: e.target.value})}
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <label className="label-field">Horário de devolução</label>
                                        <input
                                            type='time'
                                            className='input-default'
                                            value={precos.horarioDevolucao}
                                            onChange={(e) => setPrecos({...precos, horarioDevolucao: e.target.value})}
                                        />
                                    </div>
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
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mt-6">
                        <div className='mb-6'>
                            <h2 className='text-xl font-bold text-[#1A1A1A]'>Resumo do Anúncio</h2>
                            <p className='text-gray-400 text-sm mt-1'>Confira tudo antes de publicar</p>
                        </div>

                        <div className="space-y-3 mb-8 bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                            <p className="text-[#1A1A1A]"><strong>Produto:</strong> {titulo}</p>
                            <p className="text-[#1A1A1A]"><strong>Descrição:</strong> {descricao}</p>
                            <p className="text-[#1A1A1A]"><strong>Categoria:</strong> {categoria} / {subcategoria}</p>
                            <p className="text-[#1A1A1A]"><strong>Fotos:</strong> {fotos.length} adicionadas</p>
                            <p className="text-[#1A1A1A]"><strong>Endereço:</strong> {endereco.rua}, {endereco.numero}</p>
                            <p className="text-[#1A1A1A]"><strong>Disponibilidade:</strong> {disponivel.length} {disponivel.length === 1 ? 'dia selecionado' : 'dias selecionados'}</p>
                            <p className="text-[#1A1A1A]"><strong>Preço por dia:</strong> R$ {precos.precoPorDia || '0,00'}{precos.exigirCaucao && precos.caucao ? ` (+ caução de R$ ${precos.caucao})` : ''}</p>
                            <p className="text-[#1A1A1A]"><strong>Retirada/Devolução:</strong> {precos.horarioRetirada} às {precos.horarioDevolucao}</p>
                        </div>
                    
                        <div className="flex justify-between items-center">
                            <button onClick={() => setStep(step - 1)} className='btn-back'>↩ Voltar</button>
                            <div className="flex gap-4">
                                <button onClick={handleRascunho} className='bg-transparent border-2 border-[#00B795] text-[#00B795] hover:text-[#006861] hover:border-[#006861] px-6 py-2 rounded-lg font-bold transition-all cursor-pointer uppercase tracking-widest'>Salvar como rascunho</button>
                                <button onClick={handlePublicar} className='btn-next'>Publicar Anúncio</button>
                            </div>
                        </div>
                    </div>
                }
            </div>
            <Footer />
        </div>    
    )
}

export default CriarAnuncio //exportação do componente para ser usado em outros arquivos, como o 'App.jsx'
