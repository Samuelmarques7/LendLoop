import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { ptBR } from 'react-day-picker/locale'
import { useLocation, useNavigate } from 'react-router-dom'
import { LuCalendarDays, LuCamera, LuCheck, LuChevronRight, LuCircleDollarSign, LuCircleHelp, LuClock3, LuFilePenLine, LuListChecks, LuMapPin, LuPencil, LuRocket, LuTag, LuX } from 'react-icons/lu'
import 'react-day-picker/dist/style.css'
import { apiRequest } from '../services/api'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { SeletorLocalizacao } from '../components/SeletorLocalizao'
import { CampoHorario } from '../components/CampoHorario'
import { CATEGORIAS as categoriasDisponiveis, ESPECIFICACOES_SUGERIDAS as especificacoesSugeridas } from '../constants/categorias'

const SOMENTE_NUMEROS = /\D/g

function formatarCep(valor = '') {
    const digitos = String(valor).replace(SOMENTE_NUMEROS, '').slice(0, 8)
    return digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos
}

function inicioDoDia(data = new Date()) {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate())
}

function BotaoEditarResumo({ onClick, label, compacto = false }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            className={compacto
                ? 'absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-600 shadow-md backdrop-blur-sm transition-all hover:scale-105 hover:text-azul-oceano'
                : 'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:border-azul-oceano hover:text-azul-oceano'}
        >
            <LuPencil size={14} />
            {!compacto && <span>Editar</span>}
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

function FotoPrincipal({ foto, alt, className = '' }) {
    const [src, setSrc] = useState(typeof foto === 'string' ? foto : '')

    useEffect(() => {
        if (!foto) {
            setSrc('')
            return undefined
        }
        if (typeof foto === 'string') {
            setSrc(foto)
            return undefined
        }

        const url = URL.createObjectURL(foto)
        setSrc(url)
        return () => URL.revokeObjectURL(url)
    }, [foto])

    if (!src) return null
    return <img src={src} alt={alt} className={className} />
}

function PreviewAnuncio({ titulo, categoria, fotos, precos, endereco }) {
    const categoriaLabel = categoriasDisponiveis.find((item) => item.value === categoria)?.label || categoria
    const preco = Number(precos.precoPorDia)
    const precoFormatado = Number.isFinite(preco) && preco > 0
        ? preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : '0,00'

    return (
        <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_45px_-32px_rgba(3,31,59,0.4)]">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="font-extrabold text-grafite">Prévia do anúncio</h2>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-500">Rascunho</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">Ela ganha vida conforme você preenche.</p>
                    </div>
                    <div className="relative aspect-[4/3] bg-slate-100">
                        <FotoPrincipal foto={fotos[0]} alt={titulo || 'Prévia do item'} className="h-full w-full object-cover" />
                        {!fotos[0] && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm"><LuCamera size={23} /></span>
                                <span className="text-xs font-bold">Sua foto principal</span>
                            </div>
                        )}
                    </div>
                    <div className="p-5">
                        <div className="mb-3 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-verde-agua/10 px-2.5 py-1 text-[10px] font-bold text-verde-escuro"><LuTag size={11} /> {categoriaLabel || 'Categoria'}</span>
                            {endereco.cidade && <span className="inline-flex items-center gap-1 rounded-full bg-azul-oceano/10 px-2.5 py-1 text-[10px] font-bold text-azul-oceano"><LuMapPin size={11} /> {endereco.cidade}</span>}
                        </div>
                        <h3 className={`line-clamp-2 text-base font-extrabold leading-snug ${titulo ? 'text-grafite' : 'text-slate-300'}`}>{titulo || 'Seu item aparece aqui'}</h3>
                        <div className="mt-4 flex items-end gap-1 border-t border-slate-100 pt-4">
                            <span className="text-xl font-black text-grafite">R$ {precoFormatado}</span>
                            <span className="pb-0.5 text-[11px] font-semibold text-slate-400">/ dia</span>
                        </div>
                    </div>
                </section>
                <section className="rounded-2xl border border-azul-oceano/15 bg-azul-oceano/[0.06] p-4">
                    <div className="flex gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-azul-oceano shadow-sm"><LuCircleHelp size={19} /></span>
                        <div><h3 className="text-xs font-extrabold text-grafite">Dica da LendLoop</h3><p className="mt-1 text-xs leading-relaxed text-slate-500">Detalhes claros, boas fotos e um preço justo ajudam a receber solicitações mais qualificadas.</p></div>
                    </div>
                </section>
            </div>
        </aside>
    )
}

function ResumoDetalhe({ icone, titulo, onEditar, children }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-ciano shadow-sm">{icone({ size: 18 })}</span>
                    <h4 className="text-sm font-black text-slate-800">{titulo}</h4>
                </div>
                <BotaoEditarResumo onClick={onEditar} label={`Editar ${titulo.toLowerCase()}`} />
            </div>
            {children}
        </section>
    )
}

function CriarAnuncio ()
{
    const navigate = useNavigate()
    const location = useLocation()
    const [usuarioLogado] = useState(() => JSON.parse(localStorage.getItem('dadosUsuario')))
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
    }, [navigate, usuarioLogado])

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
    const [buscandoCep, setBuscandoCep] = useState(false)
    const [erroCep, setErroCep] = useState('')
    const [avisoMapa, setAvisoMapa] = useState('')

    useEffect(() => {
        const cep = endereco.cep.replace(SOMENTE_NUMEROS, '')
        if (cep.length !== 8) {
            setBuscandoCep(false)
            setErroCep('')
            return undefined
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(async () => {
            setBuscandoCep(true)
            setErroCep('')
            try {
                const resposta = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`, { signal: controller.signal })
                if (!resposta.ok) throw new Error('CEP não encontrado')
                const dados = await resposta.json()
                setEndereco((atual) => ({
                    ...atual,
                    cep: formatarCep(cep),
                    rua: dados.street || atual.rua,
                    bairro: dados.neighborhood || atual.bairro,
                    cidade: dados.city || atual.cidade,
                    estado: dados.state || atual.estado,
                }))
            } catch (error) {
                if (error.name !== 'AbortError') setErroCep('Não encontramos esse CEP. Confira os números ou preencha o endereço manualmente.')
            } finally {
                if (!controller.signal.aborted) setBuscandoCep(false)
            }
        }, 250)

        return () => {
            clearTimeout(timeoutId)
            controller.abort()
        }
    }, [endereco.cep])

    const { rua: ruaEndereco, numero: numeroEndereco, cidade: cidadeEndereco, estado: estadoEndereco } = endereco

    // Geocoding automático: sempre que rua, número, cidade e estado estiverem preenchidos,
    // busca as coordenadas via Nominatim (OpenStreetMap) para posicionar o pin no mapa.
    // Debounce de 800ms para não disparar uma request a cada tecla digitada.
    useEffect(() => {
        if (!ruaEndereco.trim() || !numeroEndereco.trim() || !cidadeEndereco.trim() || !estadoEndereco.trim() || estadoEndereco === 'SELECIONE') {
            return
        }

        const enderecoCompleto = `${ruaEndereco}, ${numeroEndereco}, ${cidadeEndereco}, ${estadoEndereco}, Brasil`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
            setBuscandoCoordenadas(true)

            const params = new URLSearchParams({
                q: enderecoCompleto,
                format: 'json',
                limit: '1',
                countrycodes: 'br'
            })

            fetch(`https://nominatim.openstreetmap.org/search?${params}`, { signal: controller.signal })
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
                .catch((error) => {
                    if (error.name !== 'AbortError') setAvisoMapa('Não foi possível posicionar o endereço automaticamente. Você ainda pode marcar o local no mapa.')
                })
                .finally(() => {
                    if (!controller.signal.aborted) setBuscandoCoordenadas(false)
                })
        }, 800)

        return () => {
            clearTimeout(timeoutId)
            controller.abort()
        }
    }, [ruaEndereco, numeroEndereco, cidadeEndereco, estadoEndereco])

    async function handleMudarPosicaoMapa(latitude, longitude) {
        setEndereco(atual => ({ ...atual, latitude, longitude }))
        setBuscandoCoordenadas(true)
        setAvisoMapa('')

        const params = new URLSearchParams({
            lat: String(latitude),
            lon: String(longitude),
            format: 'json',
            addressdetails: '1',
            zoom: '18',
            'accept-language': 'pt-BR',
        })

        try {
            const resposta = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`)
            if (!resposta.ok) throw new Error('Endereço não encontrado')
            const dados = await resposta.json()
            const local = dados.address || {}
            const estado = local['ISO3166-2-lvl4']?.split('-')[1]

            setEndereco((atual) => ({
                ...atual,
                latitude,
                longitude,
                cep: local.postcode ? formatarCep(local.postcode) : atual.cep,
                rua: local.road || local.pedestrian || local.residential || atual.rua,
                numero: local.house_number || atual.numero,
                bairro: local.suburb || local.neighbourhood || local.city_district || atual.bairro,
                cidade: local.city || local.town || local.village || local.municipality || atual.cidade,
                estado: estado || atual.estado,
            }))
            setAvisoMapa(local.house_number
                ? `Endereço atualizado pelo mapa: número ${local.house_number}.`
                : 'Local ajustado. O mapa não identificou outro número para esse ponto.')
        } catch {
            setAvisoMapa('O ponto foi salvo, mas não foi possível identificar o endereço desse local.')
        } finally {
            setBuscandoCoordenadas(false)
        }
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
    }

    function handleEspecificacoesSubmit (e)
    {
        e.preventDefault()
        if (especificacoes.some((especificacao) => !especificacao.chave.trim() && especificacao.valor.trim())) {
            setMensagem({ tipo: 'erro', texto: 'Preencha o nome da especificação ou remova a linha incompleta.' })
            return
        }
        concluirEtapa(3)
    }

    function handleFotosSubmit (e)
    {
        e.preventDefault()
        if (fotos.length < 3) {
            setMensagem({ tipo: 'erro', texto: 'Adicione pelo menos 3 fotos do item antes de continuar.' })
            return
        }
        concluirEtapa(4)
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
    }

    function handleDisponibilidadeSubmit()
    {
        if (disponivel.length === 0) {
            setMensagem({ tipo: 'erro', texto: 'Selecione pelo menos um dia disponível.' })
            return
        }
        concluirEtapa(6)
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
            <div className={`mx-auto grid w-full max-w-[1536px] flex-1 gap-6 px-4 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-8 2xl:gap-8 2xl:px-8 ${step === 7 ? 'xl:grid-cols-[230px_minmax(0,1fr)]' : 'lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[230px_minmax(0,1fr)_300px]'}`}>
                <aside className="hidden xl:block">
                    <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(3,31,59,0.45)]">
                        <h1 className="text-xl font-black text-grafite">Criar anúncio</h1>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">Deixe seu item pronto para ser encontrado e alugado.</p>
                        <ol className="mt-6 space-y-0">
                            {steps.map((nome, index) => {
                                const complete = index + 1 < step
                                const active = index + 1 === step
                                return (
                                    <li key={nome} className="relative flex min-h-[52px] gap-3 pb-3 last:min-h-0 last:pb-0">
                                        {index < steps.length - 1 && <span className={`absolute left-[15px] top-8 h-[calc(100%-1.4rem)] w-px ${complete ? 'bg-verde-agua' : 'bg-slate-200'}`} />}
                                        <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors ${active ? 'bg-verde-agua text-white shadow-[0_5px_14px_rgba(46,195,77,0.3)]' : complete ? 'bg-grafite text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {complete ? <LuCheck size={14} strokeWidth={3} /> : index + 1}
                                        </span>
                                        <div className="pt-1.5">
                                            <span className={`block text-xs font-bold ${active ? 'text-grafite' : complete ? 'text-slate-600' : 'text-slate-400'}`}>{nome}</span>
                                            {active && <span className="mt-0.5 block text-[10px] font-semibold text-verde-escuro">Etapa atual</span>}
                                        </div>
                                    </li>
                                )
                            })}
                        </ol>
                        <div className="mt-6 rounded-xl bg-slate-50 p-3.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500"><span>Progresso</span><span>{step} de {steps.length}</span></div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-verde-agua transition-all" style={{ width: `${(step / steps.length) * 100}%` }} /></div>
                        </div>
                    </div>
                </aside>

                <main className="min-w-0">
                    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 xl:hidden">
                        <div className="flex items-start justify-between gap-4">
                            <div><span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-verde-escuro">Etapa {step} de {steps.length}</span><h1 className="mt-1 text-xl font-black text-grafite">{steps[step - 1]}</h1></div>
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-grafite text-sm font-black text-white">{step}</span>
                        </div>
                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-verde-agua transition-all" style={{ width: `${(step / steps.length) * 100}%` }} /></div>
                    </div>
                    <div className="mb-5 hidden xl:block">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><span>Etapa {step} de {steps.length}</span><LuChevronRight size={13} /><span className="text-verde-escuro">{steps[step - 1]}</span></div>
                    </div>

                {mensagem && (
                    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${mensagem.tipo === 'erro' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
                        {mensagem.texto}
                    </div>
                )}

                {editandoDoResumo && step !== 7 && (
                    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-azul-oceano/20 bg-azul-oceano/5 px-4 py-3 text-sm text-azul-oceano sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-semibold">Você está ajustando uma parte do rascunho. Ao avançar, voltará ao resumo.</span>
                        <button type="button" onClick={voltarEtapa} className="shrink-0 font-bold underline underline-offset-2">Voltar ao resumo</button>
                    </div>
                )}
                    
                {step === 1 && 
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(3,31,59,0.45)] sm:p-7">
                        <div className='mb-6'>
                            <h2 className = 'text-xl font-bold text-grafite'>Detalhes do Anúncio</h2> 
                            <p className='text-gray-400 text-sm mt-1'>Conte para os locatários o que você está oferecendo</p>
                        </div>

                        <form onSubmit = {handleDetalhesSubmit}>
                            <div className = 'mb-4'>
                                <label htmlFor="titulo-anuncio" className = 'label-field'>Título</label>
                                <input
                                    id="titulo-anuncio"
                                    className='input-default'
                                    placeholder="ex: Batedeira Arno" 
                                    value = {titulo}
                                    onChange = {(e) => setTitulo(e.target.value)}
                                />
                            </div>

                            <div className = 'mb-4'>
                                <label htmlFor="descricao-anuncio" className = 'label-field'>Descrição</label>
                                <textarea 
                                    id="descricao-anuncio"
                                    className='input-default'
                                    placeholder="Descreva seu item em detalhes...." 
                                    value = {descricao}
                                    onChange = {(e) => setDescricao(e.target.value)}
                                />
                            </div>

                            <div className = 'flex flex-col gap-4 sm:flex-row'>
                                <div className='flex-1 mb-4'>
                                    <label htmlFor="categoria-anuncio" className = 'label-field'>Categoria</label>
                                    <select
                                        id="categoria-anuncio"
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
                                    <label htmlFor="subcategoria-anuncio" className = 'label-field'>Subcategorias</label>
                                    <div className='flex gap-2'>
                                        <input
                                            id="subcategoria-anuncio"
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
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(3,31,59,0.45)] sm:p-7">
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
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(3,31,59,0.45)] sm:p-7">
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
                                                <FotoPrincipal foto={foto} alt={`Foto ${indice + 1} do anúncio`} className="w-full h-32 object-cover rounded-xl" />
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
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(3,31,59,0.45)] sm:p-7">
                        <div className='mb-6'>
                            <h2 className = 'text-xl font-bold text-grafite'>Localização</h2>
                            <p className='text-gray-400 text-sm mt-1'>Onde o locatário poderá retirar o item</p>
                        </div>

                        <form onSubmit={handleLocalizacaoSubmit}>
                            <div className = 'mb-4 max-w-sm'>
                                <label htmlFor="cep-anuncio" className = 'label-field'>CEP</label>
                                <div className="relative">
                                    <input
                                        id="cep-anuncio"
                                        className='input-default pr-28'
                                        placeholder='00000-000'
                                        inputMode="numeric"
                                        autoComplete="postal-code"
                                        maxLength={9}
                                        aria-describedby={erroCep ? 'erro-cep' : undefined}
                                        aria-invalid={Boolean(erroCep)}
                                        value={endereco.cep}
                                        onChange={(e) => setEndereco((atual) => ({ ...atual, cep: formatarCep(e.target.value) }))}
                                    />
                                    {buscandoCep && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-azul-oceano">Buscando...</span>}
                                </div>
                                {erroCep && <p id="erro-cep" className="mt-2 text-xs font-medium text-red-600">{erroCep}</p>}
                                {!erroCep && <p className="mt-2 text-xs text-slate-400">Pode digitar ou colar com ou sem hífen.</p>}
                            </div>

                            <div className = 'mb-4'>
                                <label htmlFor="rua-anuncio" className = 'label-field'>Rua</label>
                                <input
                                    id="rua-anuncio"
                                    className='input-default'
                                    value={endereco.rua}
                                    onChange = {(e) => setEndereco({...endereco, rua: e.target.value})}
                                />
                            </div>

                            <div className = 'flex flex-col gap-4 mb-4 sm:flex-row'>
                                <div className = 'flex-1'>
                                    <label htmlFor="numero-anuncio" className = 'label-field'>Número</label>
                                    <input
                                        id="numero-anuncio"
                                        className='input-default'
                                        placeholder='ex: 123'
                                        value={endereco.numero}
                                        onChange = {(e) => setEndereco({...endereco, numero: e.target.value})}
                                    />
                                </div>

                                <div className = 'flex-1'>
                                    <label htmlFor="complemento-anuncio" className = 'label-field'>Complemento</label>
                                    <input
                                        id="complemento-anuncio"
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
                                    <label htmlFor="bairro-anuncio" className = 'label-field'>Bairro</label>
                                    <input
                                        id="bairro-anuncio"
                                        className='input-default'
                                        value={endereco.bairro}
                                        onChange = {(e) => setEndereco({...endereco, bairro: e.target.value})}
                                    />
                                </div>

                                <div className = 'flex-1'>
                                    <label htmlFor="cidade-anuncio" className = 'label-field'>Cidade</label>
                                    <input
                                        id="cidade-anuncio"
                                        className='input-default'
                                        value={endereco.cidade}
                                        onChange = {(e) => setEndereco({...endereco, cidade: e.target.value})}
                                    />
                                </div>

                                <div className = 'flex-1'>
                                    <label htmlFor="estado-anuncio" className = 'label-field'>Estado</label>
                                    <select
                                        id="estado-anuncio"
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
                                <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-gray-400">Arraste o pin ou clique no mapa para ajustar a localização exata.</p>
                                    {avisoMapa && <p aria-live="polite" className="text-xs font-semibold text-azul-oceano">{avisoMapa}</p>}
                                </div>
                            </div>

                            <div className = 'flex justify-between mt-6'>
                                <button type="button" onClick={voltarEtapa} className='btn-back'>↩ Voltar</button>
                                <button type='submit' className='btn-next'>Próximo</button>
                            </div>    
                        </form>
                    </div>
                }
                {step === 5 &&
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(3,31,59,0.45)] sm:p-7">
                        <div className='mb-6'>
                            <h2 className = 'text-xl font-bold text-grafite'>Disponibilidade</h2>
                            <p className='text-gray-400 text-sm mt-1'>Selecione os dias em que o item estará disponível</p>
                        </div>

                        <div className="calendario-criacao my-4 flex justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-6">
                            <DayPicker
                                mode='multiple'
                                selected={disponivel}
                                onSelect={(datas) => setDisponivel(datas || [])}
                                locale={ptBR}
                                disabled={{ before: inicioDoDia() }}
                                startMonth={inicioDoDia()}
                                endMonth={new Date(new Date().getFullYear() + 1, 11, 31)}
                                showOutsideDays
                                fixedWeeks
                                animate
                            />
                        </div>

                        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-verde-agua/15 bg-verde-agua/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p aria-live="polite" className="text-sm font-bold text-grafite">{disponivel.length} {disponivel.length === 1 ? 'dia selecionado' : 'dias selecionados'}</p>
                                <p className="mt-0.5 text-xs text-slate-500">As pessoas poderão solicitar o item somente nessas datas.</p>
                            </div>
                            {disponivel.length > 0 && <button type="button" onClick={() => setDisponivel([])} className="self-start text-xs font-bold text-verde-escuro underline underline-offset-4 sm:self-auto">Limpar seleção</button>}
                        </div>

                        <div className = 'flex justify-between mt-6'>
                            <button type="button" onClick={voltarEtapa} className='btn-back'>↩ Voltar</button>
                            <button onClick={handleDisponibilidadeSubmit} className='btn-next'>Próximo</button>                    
                        </div>
                    </div>
                }
                {step === 6 &&
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-34px_rgba(3,31,59,0.45)] sm:p-7">
                        <form onSubmit={handlePrecosSubmit}>
                            <div className='mb-6'>
                                <h2 className='text-xl font-bold text-grafite'>Preços e Condições</h2>
                                <p className='text-gray-400 text-sm mt-1'>Defina quanto vai cobrar pela locação</p>
                            </div>

                            <div className="flex flex-col gap-4 mb-4 sm:flex-row">
                                <div className="flex-1">
                                    <label htmlFor="preco-dia-anuncio" className="label-field">Preço por dia</label>
                                    <input
                                        id="preco-dia-anuncio"
                                        type='number'
                                        className='input-default'
                                        placeholder='0,00'
                                        value={precos.precoPorDia}
                                        onChange={(e) => setPrecos({...precos, precoPorDia: e.target.value})}
                                    />
                                </div>

                                <div className="flex-1">
                                    <label htmlFor="caucao-anuncio" className="label-field">Caução (Opcional)</label>
                                    <input
                                        id="caucao-anuncio"
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
                                    id="exigir-caucao-anuncio"
                                    type='checkbox'
                                    className="w-5 h-5 accent-verde-agua cursor-pointer"
                                    checked={precos.exigirCaucao}
                                    onChange={(e) => setPrecos({...precos, exigirCaucao: e.target.checked})}
                                />
                                <label htmlFor="exigir-caucao-anuncio" className='label-field mb-0'>Exigir caução</label>
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
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_65px_-42px_rgba(3,31,59,0.55)]">
                        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                            <div>
                                <span className="inline-flex items-center gap-2 rounded-full bg-verde-agua/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-verde-escuro"><LuCheck size={13} strokeWidth={3} /> Etapa final</span>
                                <h2 className="mt-3 text-2xl font-black tracking-tight text-grafite sm:text-3xl">Revise seu anúncio</h2>
                                <p className="mt-1 text-sm text-slate-500">Confira como o item será apresentado antes de publicar.</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-verde-escuro"><LuListChecks size={18} /></span> Tudo em um só lugar</div>
                        </div>

                        <div className="p-5 sm:p-8">
                            <section className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white lg:grid-cols-[minmax(20rem,.9fr)_minmax(0,1.1fr)]">
                                <div className="relative min-h-64 bg-slate-100 lg:min-h-[360px]">
                                    <BotaoEditarResumo compacto onClick={() => editarEtapa(3)} label="Editar fotos" />
                                    {fotos.length > 0 ? <FotoPrincipal foto={fotos[0]} alt={titulo || 'Foto principal do anúncio'} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300"><span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm"><LuCamera size={26} /></span><span className="text-sm font-bold">Nenhuma foto adicionada</span></div>}
                                    {fotos.length > 1 && <span className="absolute bottom-4 left-4 rounded-full bg-black/65 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">+{fotos.length - 1} fotos</span>}
                                </div>
                                <div className="flex flex-col justify-between p-6 sm:p-8">
                                    <div>
                                        <div className="flex items-start justify-between gap-4"><div className="flex flex-wrap gap-2">{categoria && <span className="inline-flex items-center gap-1.5 rounded-full bg-verde-agua/10 px-3 py-1.5 text-xs font-bold text-verde-escuro"><LuTag size={13} /> {categoriasDisponiveis.find(c => c.value === categoria)?.label || categoria}</span>}{endereco.cidade && <span className="inline-flex items-center gap-1.5 rounded-full bg-azul-oceano/10 px-3 py-1.5 text-xs font-bold text-azul-oceano"><LuMapPin size={13} /> {endereco.cidade}</span>}</div><BotaoEditarResumo onClick={() => editarEtapa(1)} label="Editar detalhes" /></div>
                                        <h3 className="mt-5 text-2xl font-black leading-tight text-grafite sm:text-3xl">{titulo || <span className="font-medium italic text-slate-300">Anúncio sem título</span>}</h3>
                                        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{descricao || <span className="italic text-slate-300">Adicione uma descrição para apresentar melhor o item.</span>}</p>
                                    </div>
                                    <div className="mt-8 flex items-end gap-2 border-t border-slate-100 pt-6"><span className="text-3xl font-black text-verde-escuro">R$ {precos.precoPorDia || '0,00'}</span><span className="pb-1 text-sm font-semibold text-slate-400">por dia</span></div>
                                </div>
                            </section>

                            <div className="mb-4 mt-8 flex items-end justify-between gap-4"><div><h3 className="text-lg font-black text-grafite">Detalhes da locação</h3><p className="mt-1 text-sm text-slate-500">Revise cada informação e edite o que for necessário.</p></div></div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <ResumoDetalhe icone={LuListChecks} titulo="Especificações" onEditar={() => editarEtapa(2)}>
                                    {especificacoes.filter(e => e.chave.trim()).length > 0 ? <div className="flex flex-wrap gap-2">{especificacoes.filter(e => e.chave.trim()).map((e, i) => <span key={i} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">{e.chave}{e.valor ? `: ${e.valor}` : ''}</span>)}</div> : <p className="text-sm italic text-slate-400">Nenhuma especificação adicionada.</p>}
                                    {subcategorias.length > 0 && <p className="mt-3 text-xs leading-relaxed text-slate-500"><strong className="text-slate-600">Subcategorias:</strong> {subcategorias.join(', ')}</p>}
                                </ResumoDetalhe>

                                <ResumoDetalhe icone={LuMapPin} titulo="Localização" onEditar={() => editarEtapa(4)}>
                                    {endereco.rua ? <><p className="text-sm font-bold text-slate-700">{endereco.rua}, {endereco.numero}</p><p className="mt-1 text-sm text-slate-500">{endereco.bairro}, {endereco.cidade} — {endereco.estado}</p><span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${endereco.latitude ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-600'}`}><LuMapPin size={12} /> {endereco.latitude ? 'Posição confirmada no mapa' : 'Posição no mapa não definida'}</span></> : <p className="text-sm italic text-slate-400">Endereço não preenchido.</p>}
                                </ResumoDetalhe>

                                <ResumoDetalhe icone={LuCalendarDays} titulo="Disponibilidade" onEditar={() => editarEtapa(5)}>
                                    {disponivel.length > 0 ? <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-verde-agua/10 text-lg font-black text-verde-escuro">{disponivel.length}</span><div><p className="text-sm font-bold text-slate-700">{disponivel.length === 1 ? 'Dia disponível' : 'Dias disponíveis'}</p><p className="mt-0.5 text-xs text-slate-500">O calendário poderá ser atualizado depois.</p></div></div> : <p className="text-sm italic text-slate-400">Nenhum dia selecionado.</p>}
                                </ResumoDetalhe>

                                <ResumoDetalhe icone={LuCircleDollarSign} titulo="Preço e condições" onEditar={() => editarEtapa(6)}>
                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-3"><div><p className="text-xs font-semibold text-slate-400">Diária</p><p className="text-lg font-black text-verde-escuro">R$ {precos.precoPorDia || '0,00'}</p></div>{precos.exigirCaucao && precos.caucao && <div><p className="text-xs font-semibold text-slate-400">Caução</p><p className="text-lg font-black text-slate-700">R$ {precos.caucao}</p></div>}</div>
                                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600"><span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5"><LuClock3 size={13} className="text-ciano" /> Retirada {precos.horarioRetirada}</span><span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5"><LuClock3 size={13} className="text-ciano" /> Devolução {precos.horarioDevolucao}</span></div>
                                </ResumoDetalhe>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 bg-slate-50 p-5 sm:p-8">
                            <div className="flex flex-col gap-5 rounded-2xl bg-verde-escuro p-5 text-white shadow-[0_18px_40px_-28px_rgba(3,45,84,.8)] sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                                <div className="flex gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-verde-agua/15 text-verde-agua"><LuRocket size={23} /></span><div><h3 className="font-black">Tudo pronto para publicar?</h3><p className="mt-1 max-w-lg text-sm leading-relaxed text-white/60">Seu anúncio poderá aparecer nas buscas assim que a publicação for concluída.</p></div></div>
                                <div className="flex flex-col gap-2 sm:flex-row"><button type="button" disabled={salvando} onClick={handleRascunho} className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-white/20 disabled:cursor-wait disabled:opacity-60">Salvar rascunho</button><button type="button" disabled={salvando} onClick={handlePublicar} className="inline-flex items-center justify-center gap-2 rounded-xl bg-verde-agua px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:-translate-y-px hover:bg-ciano disabled:cursor-wait disabled:opacity-60"><LuRocket size={16} /> Publicar anúncio</button></div>
                            </div>
                            <button type="button" onClick={voltarEtapa} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-verde-escuro">↩ Voltar para preços</button>
                        </div>
                    </div>
                }
                </main>

                {step !== 7 && <PreviewAnuncio
                    titulo={titulo}
                    categoria={categoria}
                    fotos={fotos}
                    precos={precos}
                    endereco={endereco}
                />}
            </div>
            <ModalResultadoAnuncio
                resultado={resultadoSalvamento}
                onFechar={() => setResultadoSalvamento(null)}
                onVerAnuncios={() => navigate('/painelLocador', { state: { abrirAba: 'anuncios' } })}
                onVerAnuncio={() => navigate(`/produto/${resultadoSalvamento?.anuncioId}`)}
            />
        </div>    
    )
}

export default CriarAnuncio
