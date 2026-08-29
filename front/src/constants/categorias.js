import {
  LuWrench,
  LuMonitor,
  LuWashingMachine,
  LuCar,
  LuDumbbell,
  LuMusic,
  LuCamera,
  LuPartyPopper,
  LuFlower2,
  LuBoxes,
} from 'react-icons/lu';


export const CATEGORIAS = [
  { value: 'ferramentas', label: 'Ferramentas', icone: LuWrench },
  { value: 'eletronicos', label: 'Eletrônicos', icone: LuMonitor },
  { value: 'eletrodomesticos', label: 'Eletrodomésticos', icone: LuWashingMachine },
  { value: 'esportes-lazer', label: 'Esportes e Lazer', icone: LuDumbbell },
  { value: 'instrumentos-musicais', label: 'Instrumentos Musicais', icone: LuMusic },
  { value: 'fotografia', label: 'Câmeras e Fotografia', icone: LuCamera },
  { value: 'festas-eventos', label: 'Festas e Eventos', icone: LuPartyPopper },
  { value: 'casa-jardim', label: 'Casa & Jardim', icone: LuFlower2 },
  { value: 'outros', label: 'Outros', icone: LuBoxes },
];

export const ESPECIFICACOES_SUGERIDAS = {
  'ferramentas': ['Voltagem', 'Potência (W)', 'Marca', 'Modelo', 'Estado de conservação'],
  'eletronicos': ['Voltagem', 'Marca', 'Modelo', 'Garantia', 'Estado de conservação'],
  'eletrodomesticos': ['Voltagem', 'Marca', 'Modelo', 'Capacidade', 'Estado de conservação'],
  'esportes-lazer': ['Marca', 'Tamanho', 'Estado de conservação'],
  'instrumentos-musicais': ['Marca', 'Modelo', 'Estado de conservação'],
  'fotografia': ['Marca', 'Modelo', 'Resolução', 'Acessórios inclusos'],
  'festas-eventos': ['Quantidade', 'Tamanho', 'Cor'],
  'casa-jardim': ['Marca', 'Modelo', 'Dimensões', 'Estado de conservação'],
  'outros': ['Marca', 'Modelo', 'Estado de conservação'],
};

export function buscarCategoriaPorValor(value) {
  return CATEGORIAS.find((c) => c.value === value);
}