const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OBJETIVOS_VALIDOS = new Set(['ambos', 'locatario', 'locador']);

function emailValido(email) {
  return REGEX_EMAIL.test(String(email || '').trim());
}

function senhaForteOSuficiente(senha) {
  if (typeof senha !== 'string' || senha.length < 8) return false;
  let pontos = 0;
  if (senha.length >= 8) pontos += 1;
  if (senha.length >= 12) pontos += 1;
  if (/[a-z]/.test(senha)) pontos += 1;
  if (/[A-Z]/.test(senha)) pontos += 1;
  if (/[0-9]/.test(senha)) pontos += 1;
  if (/[^A-Za-z0-9]/.test(senha)) pontos += 1;
  return pontos >= 3;
}

function cepValido(cep) {
  return /^\d{8}$/.test(String(cep || '').replace(/\D/g, ''));
}

function validarCadastro({ nome, email, senha, cep, localizacao, objetivo }) {
  if (typeof nome !== 'string' || nome.trim().length < 3 || nome.trim().length > 120) {
    return 'Informe um nome válido com pelo menos 3 caracteres.';
  }
  if (!emailValido(email) || String(email).length > 254) {
    return 'Informe um endereço de e-mail válido.';
  }
  if (!senhaForteOSuficiente(senha)) {
    return 'A senha deve ter pelo menos 8 caracteres e combinar letras, números, maiúsculas ou símbolos.';
  }
  if (!cepValido(cep) || typeof localizacao !== 'string' || !localizacao.trim()) {
    return 'Informe um CEP válido e aguarde a confirmação da localização.';
  }
  if (!OBJETIVOS_VALIDOS.has(objetivo)) {
    return 'Selecione um objetivo válido para a conta.';
  }
  return null;
}

module.exports = { cepValido, emailValido, senhaForteOSuficiente, validarCadastro };
