import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { useNavigate } from 'react-router-dom'
import 'react-day-picker/dist/style.css'
import { apiRequest, API_URL } from '../services/api'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

const categoriasDisponiveis = [
    { value: 'ferramentas', label: 'Ferramentas' },
    { value: 'eletronicos', label: 'Eletrônicos' },
    { value: 'eletrodomesticos', label: 'Eletrodomésticos' },
    { value: 'veiculos', label: 'Veículos' },
    { value: 'esportes-lazer', label: 'Esportes e Lazer' },
    { value: 'instrumentos-musicais', label: 'Instrumentos Musicais' },
    { value: 'fotografia', label: 'Câmeras e Fotografia' },
    { value: 'festas-eventos', label: 'Festas e Eventos' },
    { value: 'outros', label: 'Outros' },
]

const especificacoesSugeridas = {
    'ferramentas': ['Voltagem', 'Potência (W)', 'Marca', 'Modelo', 'Estado de conservação'],
    'eletronicos': ['Voltagem', 'Marca', 'Modelo', 'Garantia', 'Estado de conservação'],
    'eletrodomesticos': ['Voltagem', 'Marca', 'Modelo', 'Capacidade', 'Estado de conservação'],
    'veiculos': ['Marca', 'Modelo', 'Ano', 'Combustível', 'Quilometragem'],
    'esportes-lazer': ['Marca', 'Tamanho', 'Estado de conservação'],
    'instrumentos-musicais': ['Marca', 'Modelo', 'Estado de conservação'],
    'fotografia': ['Marca', 'Modelo', 'Resolução', 'Acessórios inclusos'],
    'festas-eventos': ['Quantidade', 'Tamanho', 'Cor'],
    'outros': ['Marca', 'Modelo', 'Estado de conservação'],
}

function CriarAnuncio ()
{
    const navigate = useNavigate()
    const usuarioLogado = JSON.parse(localStorage.getItem('dadosUsuario'))

    useEffect(() => {
        if (!usuarioLogado) {
            navigate('/login')
        }
    }, [])

    const [step, setStep] = useState(1)
    const steps = ['Detalhes', 'Especificações', 'Fotos', 'Localização', 'Disponibilidade', 'Preços', 'Resumo']

    const [titulo, setTitulo] = useState("") 
    const [descricao, setDescricao] = useState("")
    const [categoria, setCategoria] = useState("")

    const [subcategorias, setSubcategorias] = useState([])
    const [novaSubcategoria, setNovaSubcategoria] = useState("")

    const [especificacoes, setEspecificacoes] = useState([])

    useEffect(() => {
        if (!categoria) return

        const sugestoes = especificacoesSugeridas[categoria] || []

        setEspecificacoes(atual => {
            const chavesExistentes = atual.map(e => e.chave)
            const novas = sugestoes
                .filter(chave => !chavesExistentes.includes(chave))
                .map(chave => ({ chave, valor: '' }))

            return [...atual, ...novas]
        })
    }, [categoria])

    const inputFotoRef = useRef(null)
    const [fotos, setFotos] = useState([])
    
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

    function adicionarSubcategoria()
    {
        const valor = novaSubcategoria.trim()
        if (!valor) return

        if (subcategorias.includes(valor)) {
            setNovaSubcategoria('')
            return
        }

        setSubcategorias([...subcategorias, valor])
        setNovaSubcategoria('')
    }

    function removerSubcategoria(valor)
    {
        setSubcategorias(subcategorias.filter(s => s !== valor))
    }

    function atualizarEspecificacao(index, campo, valor)
    {
        setEspecificacoes(especificacoes.map((esp, i) => i === index ? { ...esp, [campo]: valor } : esp))
    }

    function adicionarEspecificacao()
    {
        setEspecificacoes([...especificacoes, { chave: '', valor: '' }])
    }

    function removerEspecificacao(index)
    {
        setEspecificacoes(especificacoes.filter((_, i) => i !== index))
    }

    function handleDetalhesSubmit (e)
    {
        e.preventDefault()
        setStep(2)

        console.log('Dados do formulário:')
        console.log('Título:', titulo)
        console.log('Descrição:', descricao)
        console.log('Categoria:', categoria)
        console.log('Subcategorias:', subcategorias)
    }

    function handleEspecificacoesSubmit (e)
    {
        e.preventDefault()
        setStep(3)

        console.log('Especificações:', especificacoes)
    }

    function handleFotosSubmit (e)
    {
        e.preventDefault()
        setStep(4)

        console.log('Fotos:', fotos)
    }

    function handleLocalizacaoSubmit (e)
    {
        e.preventDefault()
        setStep(5)

        console.log('Endereço:', endereco)
    }

    function handleDisponibilidadeSubmit()
    {
        setStep(6)

        console.log('Disponibilidade:', disponivel)
    }

    function handlePrecosSubmit(e)
    {
        e.preventDefault()
        setStep(7)

        console.log('Preços e Condições:', precos)
    }

    async function handleUploadFotos()
    {
        if (fotos.length === 0) return []

        const formData = new FormData()
        fotos.forEach(foto => {
            formData.append('fotos', foto)
        })

        const resposta = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData
        })

        const dados = await resposta.json()

        if(!resposta.ok){
            throw new Error(dados.erro || 'Erro ao enviar fotos')
        }

        return dados.urls
    }

    async function handlePublicar()
    {
        try {
            const urlsFotos = await handleUploadFotos()

            const data = await apiRequest('/api/anuncios', {
                method: 'POST',
                body: {
                    titulo,
                    descricao,
                    categoria,
                    subcategorias,
                    especificacoes: especificacoes.filter(e => e.chave.trim() !== ''),
                    fotos: urlsFotos,
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
            const urlsFotos = await handleUploadFotos()

            const data = await apiRequest('/api/anuncios', {
                method: 'POST',
                body: {
                    titulo,
                    descricao,
                    categoria,
                    subcategorias,
                    especificacoes: especificacoes.filter(e => e.chave.trim() !== ''),
                    fotos: urlsFotos,
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
    
    function removerFoto(index)
    {
        setFotos(fotos.filter((foto, i) => i !== index))
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
            <Header />
            <div className='max-w-4xl mx-auto px-6 w-full flex-1 pt-10 pb-16'>

                <div className='flex items-center justify-center mb-4'>
                    {steps.map((nome, index) => {
                        const complete = index + 1 < step
                        const active = index + 1 === step

                        return (
                            <div key={index} className='flex items-start'>
                                <div className='flex flex-col items-center min-w-16'>
                                
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all ${active ? 'bg-[#29C354]' : complete ? 'bg-[#1A1A1A]' : 'bg-gray-200'}`}>
                                        {index + 1}
                                    </div>

                                    <span className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 ${active ? 'text-[#29C354]' : complete ? 'text-[#1A1A1A]' : 'text-gray-300'}`}>
                                        {nome}
                                    </span>
                                </div>

                                {index < steps.length - 1 && <div className={`w-12 h-0.5 mt-4 transition-all ${complete ? 'bg-[#1A1A1A]' : 'bg-gray-200'}`}></div>}
                            </div>
                        )
                    })}
                </div>

                <div className='mb-2'>
                    <h1 className='text-2xl font-bold text-[#1A1A1A]'>Criar Novo Anúncio</h1> 
                    <p className='text-gray-400 text-sm mt-1'>Preencha as informações para anunciar seu item</p>
                </div>
                    
                {step === 1 && 
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mt-6"> 
                        <div className='mb-6'>
                            <h2 className = 'text-xl font-bold text-[#1A1A1A]'>Detalhes do Anúncio</h2> 
                            <p className='text-gray-400 text-sm mt-1'>Conte para os locatários o que você está oferecendo</p>
                        </div>

                        <form onSubmit = {handleDetalhesSubmit}>
                            <div className = 'mb-4'>
                                <label className = 'label-field'>Título</label> 
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
                                    <option value=''>Selecione</option>
                                    {categoriasDisponiveis.map((cat) => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                    </select>
                                </div>
                                <div className='flex-1 mb-4'>
                                    <label className = 'label-field'>Subcategorias</label>
                                    <div className='flex gap-2'>
                                        <input
                                            className='input-default'
                                            placeholder='ex: Furadeira de impacto'
                                            value={novaSubcategoria}
                                            onChange={(e) => setNovaSubcategoria(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    adicionarSubcategoria()
                                                }
                                            }}
                                        />
                                        <button
                                            type='button'
                                            onClick={adicionarSubcategoria}
                                            className='px-4 rounded-xl bg-[#29C354]/10 text-[#29C354] font-bold hover:bg-[#29C354]/20 transition-colors cursor-pointer'
                                        >
                                            +
                                        </button>
                                    </div>

                                    {subcategorias.length > 0 && (
                                        <div className='flex flex-wrap gap-2 mt-3'>
                                            {subcategorias.map((sub) => (
                                                <span key={sub} className='flex items-center gap-1.5 bg-gray-100 text-[#1A1A1A] text-xs font-bold px-3 py-1.5 rounded-full'>
                                                    {sub}
                                                    <button
                                                        type='button'
                                                        onClick={() => removerSubcategoria(sub)}
                                                        className='text-gray-400 hover:text-red-500 cursor-pointer'
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <p className='text-[11px] text-gray-400 mt-2'>Crie quantas subcategorias quiser para facilitar a busca do seu item.</p>
                                </div>
                            </div>
                    
                            <div className = 'flex justify-end mt-6'>
                                <button type="submit" className='btn-next'>Próximo</button>
                            </div>
                        </form>
                    </div>
                }
                {step === 2 &&
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mt-6">
                        <div className='mb-6'>
                            <h2 className='text-xl font-bold text-[#1A1A1A]'>Especificações do Item</h2>
                            <p className='text-gray-400 text-sm mt-1'>Adicione detalhes técnicos que ajudam o locatário a entender o item (voltagem, marca, tamanho, etc.)</p>
                        </div>

                        <form onSubmit={handleEspecificacoesSubmit}>
                            {especificacoes.length === 0 && (
                                <div className='text-center text-gray-400 py-8 border border-dashed border-gray-200 rounded-2xl mb-4'>
                                    <p className='text-sm font-bold'>Nenhuma especificação adicionada</p>
                                    <p className='text-xs mt-1'>Volte e selecione uma categoria para ver sugestões, ou adicione manualmente abaixo.</p>
                                </div>
                            )}

                            <div className='space-y-3 mb-4'>
                                {especificacoes.map((esp, index) => (
                                    <div key={index} className='flex gap-3 items-center'>
                                        <input
                                            className='input-default flex-1'
                                            placeholder='ex: Voltagem'
                                            value={esp.chave}
                                            onChange={(e) => atualizarEspecificacao(index, 'chave', e.target.value)}
                                        />
                                        <input
                                            className='input-default flex-1'
                                            placeholder='ex: 220V'
                                            value={esp.valor}
                                            onChange={(e) => atualizarEspecificacao(index, 'valor', e.target.value)}
                                        />
                                        <button
                                            type='button'
                                            onClick={() => removerEspecificacao(index)}
                                            className='text-gray-400 hover:text-red-500 font-bold text-lg px-2 cursor-pointer'
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                type='button'
                                onClick={adicionarEspecificacao}
                                className='text-sm font-bold text-[#29C354] hover:text-[#032D54] transition-colors cursor-pointer'
                            >
                                + Adicionar especificação
                            </button>

                            <div className='flex justify-between mt-8'>
                                <button onClick={() => setStep(step - 1)} className='btn-back'>↩ Voltar</button>
                                <button type='submit' className='btn-next'>Próximo</button>
                            </div>
                        </form>
                    </div>
                }
                {step === 3 && 
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mt-6">
                        <div className='mb-6'>
                            <h2 className = 'text-xl font-bold text-[#1A1A1A]'>Fotos do Anúncio</h2>
                            <p className='text-gray-400 text-sm mt-1'>Fotos claras aumentam suas chances de locação</p>
                        </div>

                        <form onSubmit = {handleFotosSubmit}>
                            
                            <input 
                                type='file' 
                                multiple
                                ref={inputFotoRef}
                                className='hidden'
                                onChange={(e) => {
                                    setFotos(fotosAnteriores => [...fotosAnteriores, ...Array.from(e.target.files)])
                                }}
                            />

                            <div className="border-2 border-dashed border-gray-200 hover:border-[#29C354] rounded-2xl p-4 transition-all">
    
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
                                        
                                        {Array.from({ length: Math.max(0, 6 - fotos.length) }).map((_, i) => (
                                            <div
                                                key={`vazio-${i}`}
                                                onClick={() => inputFotoRef.current.click()}
                                                className="h-32 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xl cursor-pointer hover:border-[#29C354] hover:text-[#29C354] transition-all"
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
                                                className="h-32 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xl cursor-pointer hover:border-[#29C354] hover:text-[#29C354] transition-all"
                                            >
                                                +
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div 
                                    onClick={() => inputFotoRef.current.click()}
                                    className="flex flex-col items-center justify-center py-4 cursor-pointer hover:bg-[#29C354]/5 rounded-xl transition-all"
                                >
                                    <p className="text-[#032D54] font-semibold text-sm">
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
                {step === 4 &&
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
                                
                                    <div className = 'flex items-center gap-2 mt-2'>    
                                        <input 
                                            type='checkbox'
                                            className="w-5 h-5 accent-[#29C354] cursor-pointer"
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

                            <div className='mb-4'>
                                <label className='label-field'>Localização no mapa</label>
                                <div className="relative h-56 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex items-center justify-center">
                                    <div className="absolute inset-0 opacity-40" style={{
                                        backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
                                        backgroundSize: '24px 24px'
                                    }}></div>
                                    <div className="relative flex flex-col items-center gap-2 text-center px-4">
                                        <div className="w-10 h-10 rounded-full bg-[#29C354] flex items-center justify-center shadow-lg">
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
                {step === 5 &&
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
                                    day_selected: 'bg-[#29C354] text-white rounded-lg',
                                    day_today: 'font-bold text-[#0068F3]'
                                }}
                            />
                        </div>

                        {console.log(disponivel)}

                        <p className="text-center text-[#29C354] font-semibold mb-4">
                            {disponivel.length} {disponivel.length === 1 ? 'dia selecionado' : 'dias selecionados'}
                        </p>

                        <div className = 'flex justify-between mt-6'>
                            <button onClick={() => setStep(step - 1)} className='btn-back'>↩ Voltar</button>
                            <button onClick={handleDisponibilidadeSubmit} className='btn-next'>Próximo</button>                    
                        </div>
                    </div>
                }
                {step === 6 &&
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
                                    className="w-5 h-5 accent-[#29C354] cursor-pointer"
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
                {step === 7 &&
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mt-6">
                        <div className='mb-6'>
                            <h2 className='text-xl font-bold text-[#1A1A1A]'>Resumo do Anúncio</h2>
                            <p className='text-gray-400 text-sm mt-1'>Confira tudo antes de publicar</p>
                        </div>

                        <div className="space-y-3 mb-8 bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                            <p className="text-[#1A1A1A]"><strong>Produto:</strong> {titulo}</p>
                            <p className="text-[#1A1A1A]"><strong>Descrição:</strong> {descricao}</p>
                            <p className="text-[#1A1A1A]">
                                <strong>Categoria:</strong> {categoriasDisponiveis.find(c => c.value === categoria)?.label || categoria}
                                {subcategorias.length > 0 ? ` / ${subcategorias.join(', ')}` : ''}
                            </p>
                            <p className="text-[#1A1A1A]">
                                <strong>Especificações:</strong>{' '}
                                {especificacoes.filter(e => e.chave.trim()).length > 0
                                    ? especificacoes.filter(e => e.chave.trim()).map(e => `${e.chave}: ${e.valor || '—'}`).join(' • ')
                                    : 'Nenhuma'}
                            </p>
                            <p className="text-[#1A1A1A]"><strong>Fotos:</strong> {fotos.length} adicionadas</p>
                            <p className="text-[#1A1A1A]"><strong>Endereço:</strong> {endereco.rua}, {endereco.numero}</p>
                            <p className="text-[#1A1A1A]"><strong>Disponibilidade:</strong> {disponivel.length} {disponivel.length === 1 ? 'dia selecionado' : 'dias selecionados'}</p>
                            <p className="text-[#1A1A1A]"><strong>Preço por dia:</strong> R$ {precos.precoPorDia || '0,00'}{precos.exigirCaucao && precos.caucao ? ` (+ caução de R$ ${precos.caucao})` : ''}</p>
                            <p className="text-[#1A1A1A]"><strong>Retirada/Devolução:</strong> {precos.horarioRetirada} às {precos.horarioDevolucao}</p>
                        </div>
                    
                        <div className="flex justify-between items-center">
                            <button onClick={() => setStep(step - 1)} className='btn-back'>↩ Voltar</button>
                            <div className="flex gap-4">
                                <button onClick={handleRascunho} className='bg-transparent border-2 border-[#29C354] text-[#29C354] hover:text-[#032D54] hover:border-[#032D54] px-6 py-2 rounded-lg font-bold transition-all cursor-pointer uppercase tracking-widest'>Salvar como rascunho</button>
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

export default CriarAnuncio