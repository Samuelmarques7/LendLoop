import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

// O Leaflet aponta para os ícones padrão via caminho relativo, o que quebra com bundlers
// como o Vite. Resolvendo manualmente para os arquivos importados.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: iconRetina,
    iconUrl: icon,
    shadowUrl: iconShadow,
})

const CENTRO_PADRAO = [-22.9068, -43.1729] // fallback: Rio de Janeiro, caso ainda não haja endereço/coords

// Recentraliza o mapa suavemente sempre que a posição muda (ex: geocoding automático do CEP)
function RecentralizarMapa({ posicao }) {
    const map = useMap()
    const primeiraRenderizacao = useRef(true)

    useEffect(() => {
        if (!posicao) return

        if (primeiraRenderizacao.current) {
            map.setView(posicao, 16)
            primeiraRenderizacao.current = false
        } else {
            map.flyTo(posicao, map.getZoom(), { duration: 0.8 })
        }
    }, [posicao, map])

    return null
}

function ClickHandler({ onClick }) {
    useMapEvents({ click: onClick })
    return null
}

export function SeletorLocalizacao({ latitude, longitude, onMudarPosicao, carregandoGeocoding }) {
    const posicao = latitude && longitude ? [latitude, longitude] : null

    function handleDragEnd(evento) {
        const marcador = evento.target
        const { lat, lng } = marcador.getLatLng()
        onMudarPosicao(lat, lng)
    }

    function handleMapClick(evento) {
        const { lat, lng } = evento.latlng
        onMudarPosicao(lat, lng)
    }

    return (
        <div className="relative h-56 rounded-2xl border border-gray-200 overflow-hidden">
            <MapContainer
                center={posicao || CENTRO_PADRAO}
                zoom={posicao ? 16 : 12}
                scrollWheelZoom={false}
                className="w-full h-full"
                style={{ zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickHandler onClick={handleMapClick} />
                {posicao && (
                    <Marker
                        position={posicao}
                        draggable
                        eventHandlers={{ dragend: handleDragEnd }}
                    />
                )}
                <RecentralizarMapa posicao={posicao} />
            </MapContainer>

            {carregandoGeocoding && (
                <div className="absolute top-2 right-2 bg-white/90 text-[10px] font-bold text-gray-500 px-3 py-1.5 rounded-full shadow-sm z-[1000]">
                    Localizando endereço...
                </div>
            )}

            {!posicao && !carregandoGeocoding && (
                <div className="absolute inset-x-0 bottom-2 flex justify-center z-[1000] pointer-events-none">
                    <span className="bg-white/90 text-[10px] font-bold text-gray-500 px-3 py-1.5 rounded-full shadow-sm">
                        Preencha o endereço ou clique no mapa para marcar o local
                    </span>
                </div>
            )}
        </div>
    )
}