import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { useLocation, useNavigate } from 'react-router-dom'
import { LuCheck, LuFilePenLine, LuPencil, LuX } from 'react-icons/lu'
import 'react-day-picker/dist/style.css'
import { apiRequest } from '../services/api'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { SeletorLocalizacao } from '../components/SeletorLocalizao'
import { CampoHorario } from '../components/CampoHorario'
import { CATEGORIAS as categoriasDisponiveis, ESPECIFICACOES_SUGERIDAS as especificacoesSugeridas } from '../constants/categorias'

function BotaoEditarResumo({ onClick, label }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-azul-oceano hover:text-azul-oceano"
        >
            <LuPencil size={14} />
        </button>
    )
}

function ModalResultadoAnuncio({ resultado, onFechar, onVerAnuncios, onVerAnuncio }) {
    if (!resultado) return null
    const carregando = resultado.estado === 'carregando'
    const publicado = resultado.tipo === 'publicado'

    return (
        <div
            className="modal-solicitacao-fundo fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
            onClick={() => { if (!carregando) onFechar() }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-live="polite"
                className="modal-solicitacao-caixa w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl sm:p-8"
                onClick={(evento) => evento.stopPropagation()}
            >
                {carregando && (
                    <>
                        <div className="modal-solicitacao-spin mx-auto mb-5 h-16 w-16 rounded-full border-4 border-gray-200 border-t-verde-agua" />
                        <h2 className="text-lg font-bold text-grafite">
                            {publicado ? 'Publicando seu anúncio...' : 'Salvando seu rascunho...'}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">Estamos enviando as informações e fotos.</p>
                    </>
                )}

                {resultado.estado === 'sucesso' && (
                    <>
                        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-verde-agua/10 text-verde-agua">
                            {publicado ? <LuCheck size={34} strokeWidth={3} /> : <LuFilePenLine size={30} />}
                        </span>
                        <h2 className="text-xl font-bold text-grafite">
                            {publicado ? 'Anúncio publicado!' : 'Rascunho salvo!'}
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            {publicado
                                ? 'Seu item já está disponível para aparecer nas buscas e receber solicitações.'
                                : 'Suas alterações foram guardadas. Você pode continuar editando agora ou voltar depois pelo painel.'}
                        </p>
                        <div className="mt-6 flex flex-col gap-2">
                            {publicado && resultado.anuncioId && (
                                <button type="button" onClick={onVerAnuncio} className="w-full rounded-xl bg-grafite py-3 text-sm font-bold text-white hover:bg-black">
                                    Ver anúncio publicado
                                </button>
                            )}
                            <button type="button" onClick={onVerAnuncios} className={`w-full rounded-xl py-3 text-sm font-bold ${publicado ? 'text-gray-600 hover:bg-gray-100' : 'bg-grafite text-white hover:bg-black'}`}>
                                Ir para meus anúncios
                            </button>
                            {!publicado && (
                                <button type="button" onClick={onFechar} className="w-full rounded-xl py-3 text-sm font-bold text-gray-500 hover:bg-gray-100">
                                    Continuar editando
                                </button>
                            )}
                        </div>
                    </>
                )}

                {resultado.estado === 'erro' && (
                    <>
                        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                            <LuX size={32} strokeWidth={2.5} />
                        </span>
                        <h2 className="text-xl font-bold text-grafite">Não foi possível salvar</h2>
                        <p className="mt-2 text-sm text-gray-500">{resultado.mensagem}</p>
                        <button type="button" onClick={onFechar} className="mt-6 w-full rounded-xl bg-grafite py-3 text-sm font-bold text-white hover:bg-black">
                            Voltar e corrigir
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

function CriarAnuncio ()
{
    const navigate = useNavigate()
    const location = useLocation()
    const usuarioLogado = JSON.parse(localStorage.getItem('dadosUsuario'))
    const anuncioInicial = location.state?.anuncioParaEditar || null

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

    const [step, setStep] = useState(location.state?.step || (anuncioInicial ? 7 : 1))
    const [editandoDoResumo, setEditandoDoResumo] = useState(false)
    const [anuncioId, setAnuncioId] = useState(anuncioInicial?._id || null)
    const steps = ['Detalhes', 'Especificações', 'Fotos', 'Localização', 'Disponibilidade', 'Preços', 'Resumo']

    const [titulo, setTitulo] = useState(anuncioInicial?.titulo || "")
    const [descricao, setDescricao] = useState(anuncioInicial?.descricao || "")
    const [categoria, setCategoria] = useState(anuncioInicial?.categoria || "")

    const [subcategorias, setSubcategorias] = useState(anuncioInicial?.subcategorias || [])
    const [novaSubcategoria, setNovaSubcategoria] = useState("")

    const [especificacoes, setEspecificacoes] = useState(anuncioInicial?.especificacoes || [])

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
    const [fotos, setFotos] = useState(anuncioInicial?.fotos || [])
    
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
        longitude: null,
        ...(anuncioInicial?.endereco || {})
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
    
    const [disponivel, setDisponivel] = useState(
        (anuncioInicial?.disponivel || []).map((data) => new Date(data))
    )

    const [precos, setPrecos] = useState({
        precoPorDia: '',
        caucao: '',
        exigirCaucao: false,
        horarioRetirada: '09:00',
        horarioDevolucao: '17:00',
        ...(anuncioInicial?.precos || {})
    })

    const [mensagem, setMensagem] = useState(null)
    const [resultadoSalvamento, setResultadoSalvamento] = useState(null)
    const [salvando, setSalvando] = useState(false)

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

    function concluirEtapa(proximoStep)
    {
        setMensagem(null)
        if (editandoDoResumo) {
            setEditandoDoResumo(false)
            setStep(7)
            return
        }
        setStep(proximoStep)
    }

    function editarEtapa(stepAlvo)
    {
        setMensagem(null)
        setEditandoDoResumo(true)
        setStep(stepAlvo)
    }

    function voltarEtapa()
    {
        setMensagem(null)
        if (editandoDoResumo) {
            setEditandoDoResumo(false)
            setStep(7)
            return
        }
        setStep((atual) => Math.max(1, atual - 1))
    }

    function handleDetalhesSubmit (e)
    {
        e.preventDefault()
        if (titulo.trim().length < 3 || descricao.trim().length < 20 || !categoria) {
            setMensagem({ tipo: 'erro', texto: 'Preencha um título, uma descrição com pelo menos 20 caracteres e uma categoria.' })
            return
        }
        concluirEtapa(2)

        console.log('Dados do formulário:')
        console.log('Título:', titulo)
        console.log('Descrição:', descricao)
        console.log('Categoria:', categoria)
        console.log('Subcategorias:', subcategorias)
    }

    function handleEspecificacoesSubmit (e)
    {
        e.preventDefault()
        if (especificacoes.some((especificacao) => !especificacao.chave.trim() && especificacao.valor.trim())) {
            setMensagem({ tipo: 'erro', texto: 'Preencha o nome da especificação ou remova a linha incompleta.' })
            return
        }
        concluirEtapa(3)

        console.log('Especificações:', especificacoes)
    }

    function handleFotosSubmit (e)
    {
        e.preventDefault()
        if (fotos.length < 3) {
            setMensagem({ tipo: 'erro', texto: 'Adicione pelo menos 3 fotos do item antes de continuar.' })
            return
        }
        concluirEtapa(4)

        console.log('Fotos:', fotos)
    }

    function handleLocalizacaoSubmit (e)
    {
        e.preventDefault()
        const camposObrigatorios = ['cep', 'rua', 'numero', 'bairro', 'cidade', 'estado']
        if (camposObrigatorios.some((campo) => !String(endereco[campo] || '').trim()) || endereco.estado === 'SELECIONE') {
            setMensagem({ tipo: 'erro', texto: 'Preencha todos os campos obrigatórios da localização.' })
            return
        }
        concluirEtapa(5)

        console.log('Endereço:', endereco)
    }

    function handleDisponibilidadeSubmit()
    {
        if (disponivel.length === 0) {
            setMensagem({ tipo: 'erro', texto: 'Selecione pelo menos um dia disponível.' })
            return
        }
        concluirEtapa(6)

        console.log('Disponibilidade:', disponivel)
    }

    function handlePrecosSubmit(e)
    {
        e.preventDefault()
        const preco = Number(precos.precoPorDia)
        const caucao = Number(precos.caucao || 0)
        if (!Number.isFinite(preco) || preco <= 0 || !Number.isFinite(caucao) || caucao < 0 || (precos.exigirCaucao && caucao <= 0)) {
            setMensagem({ tipo: 'erro', texto: 'Informe um preço diário válido e uma caução não negativa. Se exigir caução, ela deve ser maior que zero.' })
            return
        }
        concluirEtapa(7)

        console.log('Preços e Condições:', precos)
    }

    async function handleUploadFotos()
    {
        const urlsExistentes = fotos.filter((foto) => typeof foto === 'string')
        const arquivosNovos = fotos.filter((foto) => foto instanceof File)
        if (arquivosNovos.length === 0) return urlsExistentes

        const formData = new FormData()
        arquivosNovos.forEach(foto => {
            formData.append('fotos', foto)
        })

        const dados = await apiRequest('/api/upload', {
            method: 'POST',
            body: formData
        })

        return [...urlsExistentes, ...dados.urls]
    }

    function montarDadosAnuncio(urlsFotos, status)
    {
        return {
            titulo,
            descricao,
            categoria,
            subcategorias,
            especificacoes: especificacoes.filter(e => e.chave.trim() !== '').map(e => ({
                chave: e.chave.trim(),
                valor: e.valor.trim()
            })),
            fotos: urlsFotos,
            endereco,
            disponivel,
            precos,
            status,
            locador: usuarioLogado.id
        }
    }

    async function salvarAnuncio(status)
    {
        if (status === 'publicado' && (fotos.length < 3 || fotos.length > 6)) {
            setMensagem({ tipo: 'erro', texto: 'Adicione de 3 a 6 fotos do item para publicar.' })
            setStep(3)
            return
        }

        setSalvando(true)
        setResultadoSalvamento({ estado: 'carregando', tipo: status })
        try {
            const urlsFotos = await handleUploadFotos()
            const resposta = await apiRequest(anuncioId ? `/api/anuncios/${anuncioId}` : '/api/anuncios', {
                method: anuncioId ? 'PUT' : 'POST',
                body: montarDadosAnuncio(urlsFotos, status)
            })
            const idSalvo = resposta.anuncio?._id || anuncioId
            setAnuncioId(idSalvo)
            setFotos(urlsFotos)
            setMensagem(null)
            setResultadoSalvamento({ estado: 'sucesso', tipo: status, anuncioId: idSalvo })
        } catch (error) {
            setMensagem({ tipo: 'erro', texto: error.message });
            setResultadoSalvamento({ estado: 'erro', tipo: status, mensagem: error.message })
        } finally {
            setSalvando(false)
        }
    }

    function handlePublicar()
    {
        salvarAnuncio('publicado')
    }

    function handleRascunho()
    {
        salvarAnuncio('rascunho')
    }
    
    function removerFoto(index)
    {
        setFotos(fotos.filter((foto, i) => i !== index))
    }

    if (carregandoVerificacao) {
        return (
            <div className="page-shell min-h-screen flex flex-col">
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
            <div className="page-shell min-h-screen flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center px-6">
                    <div className="max-w-md w-full bg-white border border-gray-100 rounded-3xl shadow-sm p-8 text-center">
                        <h1 className="text-xl font-black text-grafite mb-2">Identidade verificada é necessária</h1>
                        <p className="text-gray-500 text-sm mb-6">
                            Para publicar um anúncio no LendLoop, sua identidade precisa ser verificada primeiro.
                            {' '}{mensagens[statusVerificacao] || mensagens.nao_enviado}
                        </p>
                        <button
                            onClick={() => navigate('/configuracoes')}
                            className="w-full bg-verde-escuro text-white font-bold py-3 rounded-xl hover:bg-verde-escuro transition-colors cursor-pointer"
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
        <div className="page-shell min-h-screen flex flex-col">
            <Header />
            <div className={`mx-auto w-full flex-1 px-3 pb-12 pt-6 transition-all sm:px-6 sm:pb-16 sm:pt-10 ${step === 7 ? 'max-w-6xl' : 'max-w-4xl'}`}>

                <div className='-mx-3 mb-4 flex items-center justify-start overflow-x-auto px-3 pb-2 [scrollbar-width:none] sm:mx-0 sm:justify-center sm:px-0'>
                    {steps.map((nome, index) => {
                        const complete = index + 1 < step
                        const active = index + 1 === step

                        return (
                            <div key={index} className='flex items-start'>
                                <div className='flex min-w-14 flex-col items-center sm:min-w-16'>
                                
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all ${active ? 'bg-verde-agua' : complete ? 'bg-grafite' : 'bg-gray-200'}`}>
                                        {index + 1}
                                    </div>

                                    <span className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 ${active ? 'text-verde-agua' : complete ? 'text-grafite' : 'text-gray-300'}`}>
                                        {nome}
                                    </span>
                                </div>

                                {index < steps.length - 1 && <div className={`mt-4 h-0.5 w-6 transition-all sm:w-12 ${complete ? 'bg-grafite' : 'bg-gray-200'}`}></div>}
                            </div>
                        )
                    })}
                </div>

                <div className='mb-2'>
                    <h1 className='text-2xl font-bold text-grafite'>Criar Novo Anúncio</h1> 
                    <p className='text-gray-400 text-sm mt-1'>Preencha as informações para anunciar seu item</p>
                </div>

                {mensagem && (
                    <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${mensagem.tipo === 'erro' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
                        {mensagem.texto}
                    </div>
                )}

                {editandoDoResumo && step !== 7 && (
                    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-azul-oceano/20 bg-azul-oceano/5 px-4 py-3 text-sm text-azul-oceano sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-semibold">Você está ajustando uma parte do rascunho. Ao avançar, voltará ao resumo.</span>
                        <button type="button" onClick={voltarEtapa} className="shrink-0 font-bold underline underline-offset-2">Voltar ao resumo</button>
                    </div>
                )}
                    
                {step === 1 && 
                    <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
                        <div className='mb-6'>
                            <h2 className = 'text-xl font-bold text-grafite'>Detalhes do Anúncio</h2> 
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

                            <div className = 'flex flex-col gap-4 sm:flex-row'>
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
                                            className='px-4 rounded-xl bg-verde-agua/10 text-verde-agua font-bold hover:bg-verde-agua/20 transition-colors cursor-pointer'
                                        >
                                            +
                                        </button>
                                    </div>

                                    {subcategorias.length > 0 && (
                                        <div className='flex flex-wrap gap-2 mt-3'>
                                            {subcategorias.map((sub) => (
                                                <span key={sub} className='flex items-center gap-1.5 bg-gray-100 text-grafite text-xs font-bold px-3 py-1.5 rounded-full'>
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
                    <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
                        <div className='mb-6'>
                            <h2 className='text-xl font-bold text-grafite'>Especificações do Item</h2>
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
                                className='text-sm font-bold text-verde-agua hover:text-verde-escuro transition-colors cursor-pointer'
                            >
                                + Adicionar especificação
                            </button>

                            <div className='mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between'>
                                <button type="button" onClick={voltarEtapa} className='btn-back'>↩ Voltar</button>
                                <button type='submit' className='btn-next'>Próximo</button>
                            </div>
                        </form>
                    </div>
                }
                {step === 3 && 
                    <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
                        <div className='mb-6'>
                            <h2 className = 'text-xl font-bold text-grafite'>Fotos do Anúncio</h2>
                            <p className='text-gray-500 text-sm mt-1'>Adicione de 3 a 6 fotos: mostre o item inteiro, outro ângulo e os detalhes.</p>
                            <p className='text-gray-500 text-xs mt-2'>Prefira fotos nítidas, com boa iluminação e pelo menos 1200 pixels no lado maior.</p>
                        </div>

                        <form onSubmit = {handleFotosSubmit}>
                            
                            <input 
                                type='file' 
                                multiple
                                accept="image/jpeg,image/png,image/webp"
                                ref={inputFotoRef}
                                className='hidden'
                                onChange={(e) => {
                                    const novas = Array.from(e.target.files || [])
                                    e.target.value = ''
                                    if (fotos.length + novas.length > 6) {
                                        setMensagem({ tipo: 'erro', texto: 'Você pode adicionar no máximo 6 fotos.' })
                                        return
                                    }
                                    if (novas.some(foto => !['image/jpeg', 'image/png', 'image/webp'].includes(foto.type) || foto.size > 5 * 1024 * 1024)) {
                                        setMensagem({ tipo: 'erro', texto: 'Use fotos JPG, PNG ou WebP de até 5 MB cada.' })
                                        return
                                    }
                                    setMensagem(null)
                                    setFotos(fotosAnteriores => [...fotosAnteriores, ...novas])
                                }}
                            />

                            <div className="border-2 border-dashed border-gray-200 hover:border-verde-agua rounded-2xl p-4 transition-all">
    
                                {fotos.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-3">
                                        {fotos.map((foto, indice) => (
                                            <div key={indice} className="relative">
                                                <img 
                                                    src={typeof foto === 'string' ? foto : URL.createObjectURL(foto)}
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
                                                className="h-32 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xl cursor-pointer hover:border-verde-agua hover:text-verde-agua transition-all"
                                            >
                                                +
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-3">
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <div
                                                key={`vazio-${i}`}
                                                onClick={() => inputFotoRef.current.click()}
                                                className="h-32 rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xl cursor-pointer hover:border-verde-agua hover:text-verde-agua transition-all"
                                            >
                                                +
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div 
                                    onClick={() => inputFotoRef.current.click()}
                                    className="flex flex-col items-center justify-center py-4 cursor-pointer hover:bg-verde-agua/5 rounded-xl transition-all"
                                >
                                    <p className="text-verde-escuro font-semibold text-sm">
                                        {fotos.length > 0 ? '+ Adicionar mais fotos' : 'Clique em qualquer quadro para adicionar fotos'}
                                    </p>
                                    <p className="text-gray-400 text-xs mt-1">{fotos.length}/6 fotos · Mínimo de 3 · PNG ou JPG de até 5 MB cada</p>
                                </div>
                            </div>
                            
                            <div className = 'flex justify-between mt-6'>
                                <button type="button" onClick={voltarEtapa} className='btn-back'>↩ Voltar</button>
                                <button type='submit' className='btn-next'>Próximo</button>
                            </div>
                        </form> 
                    </div>
                }
                {step === 4 &&
                    <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
                        <div className='mb-6'>
                            <h2 className = 'text-xl font-bold text-grafite'>Localização</h2>
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

                            <div className = 'flex flex-col gap-4 mb-4 sm:flex-row'>
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
                                            className="w-5 h-5 accent-verde-agua cursor-pointer"
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

                            <div className = 'flex flex-col gap-4 mb-4 sm:flex-row'>
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
                                <button type="button" onClick={voltarEtapa} className='btn-back'>↩ Voltar</button>
                                <button type='submit' className='btn-next'>Próximo</button>
                            </div>    
                        </form>
                    </div>
                }
                {step === 5 &&
                    <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
                        <div className='mb-6'>
                            <h2 className = 'text-xl font-bold text-grafite'>Disponibilidade</h2>
                            <p className='text-gray-400 text-sm mt-1'>Selecione os dias em que o item estará disponível</p>
                        </div>

                        <div className="flex justify-center my-4 bg-gray-50/50 rounded-2xl border border-gray-100 p-6">
                            <DayPicker
                                mode='multiple'
                                selected={disponivel}
                                onSelect={setDisponivel}
                                classNames={{
                                    day_selected: 'bg-verde-agua text-white rounded-lg',
                                    day_today: 'font-bold text-azul-oceano'
                                }}
                            />
                        </div>

                        {console.log(disponivel)}

                        <p className="text-center text-verde-agua font-semibold mb-4">
                            {disponivel.length} {disponivel.length === 1 ? 'dia selecionado' : 'dias selecionados'}
                        </p>

                        <div className = 'flex justify-between mt-6'>
                            <button type="button" onClick={voltarEtapa} className='btn-back'>↩ Voltar</button>
                            <button onClick={handleDisponibilidadeSubmit} className='btn-next'>Próximo</button>                    
                        </div>
                    </div>
                }
                {step === 6 &&
                    <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
                        <form onSubmit={handlePrecosSubmit}>
                            <div className='mb-6'>
                                <h2 className='text-xl font-bold text-grafite'>Preços e Condições</h2>
                                <p className='text-gray-400 text-sm mt-1'>Defina quanto vai cobrar pela locação</p>
                            </div>

                            <div className="flex flex-col gap-4 mb-4 sm:flex-row">
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
                                    className="w-5 h-5 accent-verde-agua cursor-pointer"
                                    checked={precos.exigirCaucao}
                                    onChange={(e) => setPrecos({...precos, exigirCaucao: e.target.checked})}
                                />
                                <label className='label-field mb-0'>Exigir caução</label>
                            </div>

                            <div className='border-t border-gray-100 pt-6 mb-2'>
                                <h3 className='text-sm font-bold text-grafite uppercase tracking-wide mb-4'>Regras de Reserva</h3>
                                <div className="flex flex-col gap-4 sm:flex-row">
                                    <div className="flex-1">
                                        <CampoHorario
                                            label="Horário de retirada"
                                            value={precos.horarioRetirada}
                                            onChange={(horarioRetirada) => setPrecos({...precos, horarioRetirada})}
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <CampoHorario
                                            label="Horário de devolução"
                                            value={precos.horarioDevolucao}
                                            onChange={(horarioDevolucao) => setPrecos({...precos, horarioDevolucao})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='flex justify-between mt-6'>
                                <button type="button" onClick={voltarEtapa} className='btn-back'>↩ Voltar</button>
                                <button type='submit' className='btn-next'>Concluir</button>
                            </div>
                        </form>
                    </div>
                }
                {step === 7 &&
                    <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
                        <div className='mb-6'>
                            <h2 className='text-xl font-bold text-grafite'>Resumo do Anúncio</h2>
                            <p className='text-gray-400 text-sm mt-1'>Confira tudo antes de publicar</p>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-4 mb-6">

                            {/* Card de preview: foto + informações principais */}
                            <div className="relative flex shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-100 lg:w-[38%]">
                                <div className="h-40 bg-gray-100 relative shrink-0">
                                    <BotaoEditarResumo onClick={() => editarEtapa(3)} label="Editar fotos" />
                                    {fotos.length > 0 ? (
                                        <img src={typeof fotos[0] === 'string' ? fotos[0] : URL.createObjectURL(fotos[0])} className="w-full h-full object-cover" />
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

                                <div className="relative flex-1 p-5">
                                    <BotaoEditarResumo onClick={() => editarEtapa(1)} label="Editar detalhes" />
                                    <div className="flex items-start justify-between gap-3 mb-1.5">
                                        <h3 className="truncate pr-10 text-lg font-bold text-grafite">
                                            {titulo || <span className="text-gray-300 italic font-normal">Sem título</span>}
                                        </h3>
                                    </div>

                                    <span className="text-xl font-black text-grafite">R$ {precos.precoPorDia || '0,00'}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase"> /dia</span>

                                    {categoria && (
                                        <div>
                                            <span className="inline-block bg-verde-agua/10 text-verde-agua text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mt-2 mb-2">
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
                            <div className="grid flex-1 grid-cols-1 content-start gap-3 sm:grid-cols-2">

                                <div className="relative rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                                    <BotaoEditarResumo onClick={() => editarEtapa(2)} label="Editar especificações" />
                                    <h4 className="mb-2 pr-9 text-[9px] font-bold uppercase tracking-widest text-gray-400">Especificações</h4>
                                    {especificacoes.filter(e => e.chave.trim()).length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {especificacoes.filter(e => e.chave.trim()).map((e, i) => (
                                                <span key={i} className="bg-white border border-gray-200 text-grafite text-[10px] font-semibold px-2 py-1 rounded-md">
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

                                <div className="relative rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                                    <BotaoEditarResumo onClick={() => editarEtapa(4)} label="Editar localização" />
                                    <h4 className="mb-2 pr-9 text-[9px] font-bold uppercase tracking-widest text-gray-400">Localização</h4>
                                    {endereco.rua ? (
                                        <>
                                            <p className="text-xs font-semibold text-grafite truncate">{endereco.rua}, {endereco.numero}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{endereco.bairro}, {endereco.cidade} - {endereco.estado}</p>
                                            <span className={`inline-block mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full ${endereco.latitude ? 'bg-verde-agua/10 text-verde-agua' : 'bg-orange-50 text-orange-500'}`}>
                                                {endereco.latitude ? '📍 Localização marcada no mapa' : '⚠ Posição no mapa não definida'}
                                            </span>
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-300 italic">Endereço não preenchido</p>
                                    )}
                                </div>

                                <div className="relative rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                                    <BotaoEditarResumo onClick={() => editarEtapa(5)} label="Editar disponibilidade" />
                                    <h4 className="mb-2 pr-9 text-[9px] font-bold uppercase tracking-widest text-gray-400">Disponibilidade</h4>
                                    {disponivel.length > 0 ? (
                                        <p className="text-xs font-semibold text-grafite">
                                            {disponivel.length} {disponivel.length === 1 ? 'dia selecionado' : 'dias selecionados'}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-300 italic">Nenhum dia selecionado</p>
                                    )}
                                </div>

                                <div className="relative rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                                    <BotaoEditarResumo onClick={() => editarEtapa(6)} label="Editar preço e condições" />
                                    <h4 className="mb-2 pr-9 text-[9px] font-bold uppercase tracking-widest text-gray-400">Preço e Condições</h4>
                                    <p className="text-xs font-semibold text-grafite">
                                        R$ {precos.precoPorDia || '0,00'} / dia
                                    </p>
                                    {precos.exigirCaucao && precos.caucao && (
                                        <p className="text-[10px] text-gray-400 mt-0.5">+ caução de R$ {precos.caucao}</p>
                                    )}
                                    <p className="text-[10px] text-gray-400 mt-0.5">Retirada {precos.horarioRetirada} • Devolução {precos.horarioDevolucao}</p>
                                </div>

                            </div>

                        </div>

                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <button type="button" onClick={voltarEtapa} className='btn-back'>↩ Voltar</button>
                            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                                <button type="button" disabled={salvando} onClick={handleRascunho} className='rounded-lg border-2 border-verde-agua bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-verde-agua transition-all hover:border-verde-escuro hover:text-verde-escuro disabled:cursor-wait disabled:opacity-60 sm:px-6'>Salvar como rascunho</button>
                                <button type="button" disabled={salvando} onClick={handlePublicar} className='btn-next disabled:cursor-wait disabled:opacity-60'>Publicar Anúncio</button>
                            </div>
                        </div>
                    </div>
                }
            </div>
            <ModalResultadoAnuncio
                resultado={resultadoSalvamento}
                onFechar={() => setResultadoSalvamento(null)}
                onVerAnuncios={() => navigate('/painelLocador', { state: { abrirAba: 'anuncios' } })}
                onVerAnuncio={() => navigate(`/produto/${resultadoSalvamento?.anuncioId}`)}
            />
            <Footer />
        </div>    
    )
}

export default CriarAnuncio
