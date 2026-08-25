export function calcularForcaSenha(senha) {
  if (!senha) {
    return { pontos: 0, maximo: 6, nivel: 'vazio', label: '', cor: 'bg-gray-200' };
  }

  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (senha.length >= 12) pontos++;
  if (/[a-z]/.test(senha)) pontos++;
  if (/[A-Z]/.test(senha)) pontos++;
  if (/[0-9]/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;

  const maximo = 6;

  if (pontos <= 2) {
    return { pontos, maximo, nivel: 'fraca', label: 'Fraca', cor: 'bg-red-500', corTexto: 'text-red-500' };
  }
  if (pontos <= 4) {
    return { pontos, maximo, nivel: 'media', label: 'Média', cor: 'bg-yellow-500', corTexto: 'text-yellow-600' };
  }
  return { pontos, maximo, nivel: 'forte', label: 'Forte', cor: 'bg-[#29C354]', corTexto: 'text-[#29C354]' };
}

export function senhaEhForteOSuficiente(senha) {
  if (!senha || senha.length < 8) return false;
  const { nivel } = calcularForcaSenha(senha);
  return nivel === 'media' || nivel === 'forte';
}