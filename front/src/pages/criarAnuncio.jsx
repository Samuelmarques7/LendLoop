import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { useNavigate } from 'react-router-dom'
import 'react-day-picker/dist/style.css'
import { apiRequest, API_URL } from '../services/api'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { SeletorLocalizacao } from '../components/SeletorLocalizao'
import { CATEGORIAS as categoriasDisponiveis, ESPECIFICACOES_SUGERIDAS as especificacoesSugeridas } from '../constants/categorias'

function CriarAnuncio ()
{
    const navigate = useNavigate()
    const usuarioLogado = JSON.parse(localStorage.getItem('dadosUsuario'))

    const [statusVerificacao, setStatusVerificacao] = useState(null)
    const [carregandoVerificacao, setCarregandoVerificacao] = useState(true)

    useEffect(() => {
        if (!usuarioLogado) {
            navigate('/login')
            return
        }

        apiRequest(`/api/usuarios/${usuarioLogado.id}/verificacao`)
            .then((dados) => setStatusVerificacao(dados.status))
            .catch(() => setStatusVerificacao('nao_enviado'))
            .finally(() => setCarregandoVerificacao(false))
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
        estado: "",
        latitude: null,
        longitude: null
    })

    const [buscandoCoordenadas, setBuscandoCoordenadas] = useState(false)

    // Geocoding automático: sempre que rua, número, cidade e estado estiverem preenchidos,
    // busca as coordenadas via Nominatim (OpenStreetMap) para posicionar o pin no mapa.
    // Debounce de 800ms para não disparar uma request a cada tecla digitada.
    useEffect(() => {
        const { rua, numero, cidade, estado } = endereco

        if (!rua.trim() || !numero.trim() || !cidade.trim() || !estado.trim() || estado === 'SELECIONE') {
            return
        }

        const enderecoCompleto = `${rua}, ${numero}, ${cidade}, ${estado}, Brasil`

        const timeoutId = setTimeout(() => {
            setBuscandoCoordenadas(true)

            const params = new URLSearchParams({
                q: enderecoCompleto,
                format: 'json',
                limit: '1',
                countrycodes: 'br'
            })

            fetch(`https://nominatim.openstreetmap.org/search?${params}`)
                .then(resposta => resposta.json())
                .then(resultados => {
                    if (resultados.length > 0) {
                        setEndereco(atual => ({
                            ...atual,
                            latitude: parseFloat(resultados[0].lat),
                            longitude: parseFloat(resultados[0].lon)
                        }))
                    }
                })
                .catch(() => {
                    // Falha silenciosa: o usuário ainda pode marcar o ponto manualmente no mapa
                })
                .finally(() => setBuscandoCoordenadas(false))
        }, 800)

        return () => clearTimeout(timeoutId)
    }, [endereco.rua, endereco.numero, endereco.cidade, endereco.estado])

    function handleMudarPosicaoMapa(latitude, longitude) {
        setEndereco(atual => ({ ...atual, latitude, longitude }))
    }

    const estados = ['SELECIONE','AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
    
    const [disponivel, setDisponivel] = useState([])

    const [precos, setPrecos] = useState({
        precoPorDia: '',
        caucao: '',
        exigirCaucao: false,
        horarioRetirada: '09:00',
        horarioDevolucao: '17:00'
    })

    const [, setMensagem] = useState(null)

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

            await apiRequest('/api/anuncios', {
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

            await apiRequest('/api/anuncios', {
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

    if (carregandoVerificacao) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center text-gray-400">Carregando...</div>
                <Footer />
            </div>
        )
    }

    if (statusVerificacao !== 'aprovado') {
        const mensagens = {
            nao_enviado: 'Você ainda não enviou seus documentos de identidade.',
            pendente: 'Seus documentos estão em análise pela nossa equipe.',
            rejeitado: 'Sua verificação foi recusada. Envie os documentos novamente.',
        }

        return (
            <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center px-6">
                    <div className="max-w-md w-full bg-white border border-gray-100 rounded-3xl shadow-sm p-8 text-center">
                        <h1 className="text-xl font-black text-[#1A1A1A] mb-2">Identidade verificada é necessária</h1>
                        <p className="text-gray-500 text-sm mb-6">
                            Para publicar um anúncio no LendLoop, sua identidade precisa ser verificada primeiro.
                            {' '}{mensagens[statusVerificacao] || mensagens.nao_enviado}
                        </p>
                        <button
                            onClick={() => navigate('/configuracoes')}
                            className="w-full bg-[#032D54] text-white font-bold py-3 rounded-xl hover:bg-[#021f3a] transition-colors cursor-pointer"
                        >
                            Ir para verificação de identidade
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
            <Header />
            <div className={`mx-auto px-6 w-full flex-1 pt-10 pb-16 transition-all ${step === 7 ? 'max-w-6xl' : 'max-w-4xl'}`}>

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
                                        const novoCep = e.target.value
                                        setEndereco(atual => ({...atual, cep: novoCep }))

                                        if(novoCep.length === 8)
                                        {
                                            fetch(`https://brasilapi.com.br/api/cep/v1/${novoCep}`)
                                                .then(retorno => retorno.json())
                                                .then(dados =>
                                                    {
                                                        setEndereco( atual => ({
                                                            ...atual,
                                                            rua: dados.street,
                                                            bairro: dados.neighborhood,
                                                            cidade: dados.city,
                                                            estado: dados.state
                                                        }))
                                                    })
                                                    .catch(() => {
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
                                <SeletorLocalizacao
                                    latitude={endereco.latitude}
                                    longitude={endereco.longitude}
                                    onMudarPosicao={handleMudarPosicaoMapa}
                                    carregandoGeocoding={buscandoCoordenadas}
                                />
                                {endereco.latitude && (
                                    <p className="text-xs text-gray-400 mt-2">Arraste o pin ou clique no mapa para ajustar a localização exata</p>
                                )}
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

                        <div className="flex flex-col lg:flex-row gap-4 mb-6">

                            {/* Card de preview: foto + informações principais */}
                            <div className="rounded-2xl border border-gray-100 overflow-hidden lg:w-[38%] shrink-0 flex flex-col">
                                <div className="h-40 bg-gray-100 relative shrink-0">
                                    {fotos.length > 0 ? (
                                        <img src={URL.createObjectURL(fotos[0])} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                            <span className="text-2xl mb-1">📷</span>
                                            <span className="text-[10px] font-bold">Sem foto</span>
                                        </div>
                                    )}
                                    {fotos.length > 1 && (
                                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                            +{fotos.length - 1}
                                        </span>
                                    )}
                                </div>

                                <div className="p-5 flex-1">
                                    <div className="flex items-start justify-between gap-3 mb-1.5">
                                        <h3 className="text-lg font-bold text-[#1A1A1A] truncate">
                                            {titulo || <span className="text-gray-300 italic font-normal">Sem título</span>}
                                        </h3>
                                    </div>

                                    <span className="text-xl font-black text-[#1A1A1A]">R$ {precos.precoPorDia || '0,00'}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase"> /dia</span>

                                    {categoria && (
                                        <div>
                                            <span className="inline-block bg-[#29C354]/10 text-[#29C354] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mt-2 mb-2">
                                                {categoriasDisponiveis.find(c => c.value === categoria)?.label || categoria}
                                            </span>
                                        </div>
                                    )}

                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {descricao || <span className="text-gray-300 italic">Sem descrição</span>}
                                    </p>
                                </div>
                            </div>

                            {/* Detalhes agrupados: grid 2x2 ao lado do preview, usando a largura extra */}
                            <div className="grid grid-cols-2 gap-3 flex-1 content-start">

                                <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                                    <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Especificações</h4>
                                    {especificacoes.filter(e => e.chave.trim()).length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {especificacoes.filter(e => e.chave.trim()).map((e, i) => (
                                                <span key={i} className="bg-white border border-gray-200 text-[#1A1A1A] text-[10px] font-semibold px-2 py-1 rounded-md">
                                                    {e.chave}{e.valor ? `: ${e.valor}` : ''}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-300 italic">Nenhuma especificação</p>
                                    )}
                                    {subcategorias.length > 0 && (
                                        <p className="text-[10px] text-gray-400 mt-2">Subcategorias: {subcategorias.join(', ')}</p>
                                    )}
                                </div>

                                <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                                    <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Localização</h4>
                                    {endereco.rua ? (
                                        <>
                                            <p className="text-xs font-semibold text-[#1A1A1A] truncate">{endereco.rua}, {endereco.numero}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{endereco.bairro}, {endereco.cidade} - {endereco.estado}</p>
                                            <span className={`inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full ${endereco.latitude ? 'bg-[#29C354]/10 text-[#29C354]' : 'bg-orange-50 text-orange-500'}`}>
                                                {endereco.latitude ? '📍 Localização marcada no mapa' : '⚠ Posição no mapa não definida'}
                                            </span>
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-300 italic">Endereço não preenchido</p>
                                    )}
                                </div>

                                <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                                    <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Disponibilidade</h4>
                                    {disponivel.length > 0 ? (
                                        <p className="text-xs font-semibold text-[#1A1A1A]">
                                            {disponivel.length} {disponivel.length === 1 ? 'dia selecionado' : 'dias selecionados'}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-300 italic">Nenhum dia selecionado</p>
                                    )}
                                </div>

                                <div className="bg-gray-50/70 rounded-xl p-4 border border-gray-100">
                                    <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Preço e Condições</h4>
                                    <p className="text-xs font-semibold text-[#1A1A1A]">
                                        R$ {precos.precoPorDia || '0,00'} / dia
                                    </p>
                                    {precos.exigirCaucao && precos.caucao && (
                                        <p className="text-[10px] text-gray-400 mt-0.5">+ caução de R$ {precos.caucao}</p>
                                    )}
                                    <p className="text-[10px] text-gray-400 mt-0.5">Retirada {precos.horarioRetirada} • Devolução {precos.horarioDevolucao}</p>
                                </div>

                            </div>

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