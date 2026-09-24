// Datas de reserva circulam como chaves "AAAA-MM-DD". É o formato que a API
// usa para validar disponibilidade, e evita erros de fuso horário ao comparar dias.

export function chaveDoDia(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function dataDaChave(chave) {
  const [ano, mes, dia] = chave.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

// Datas vindas da API são comparadas pelo dia em UTC, como faz o backend.
export function chaveDaApi(valor) {
  return new Date(valor).toISOString().slice(0, 10);
}

export function somarDias(chave, quantidade) {
  const data = dataDaChave(chave);
  data.setDate(data.getDate() + quantidade);
  return chaveDoDia(data);
}

// Diárias de uma reserva: do dia da retirada até a véspera da devolução.
export function diasDoPeriodo(inicio, fim) {
  const dias = [];
  for (let dia = inicio; dia < fim && dias.length <= 366; dia = somarDias(dia, 1)) {
    dias.push(dia);
  }
  return dias;
}

export function diasOcupados(reservas) {
  const ocupados = new Set();
  for (const reserva of reservas) {
    diasDoPeriodo(chaveDaApi(reserva.dataInicio), chaveDaApi(reserva.dataFim)).forEach((dia) => ocupados.add(dia));
  }
  return ocupados;
}

export function formatarChave(chave, opcoes = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
  return dataDaChave(chave).toLocaleDateString('pt-BR', opcoes);
}
