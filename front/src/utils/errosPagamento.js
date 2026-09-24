const MENSAGENS_POR_CODIGO = {
  no_payment_method_for_provided_bin: 'Não conseguimos identificar a bandeira deste cartão. Confira o número ou tente outro cartão.',
  get_card_bin_payment_methods_failed: 'Não foi possível identificar o cartão agora. Confira o número e tente novamente.',
  get_payment_methods_failed: 'Não foi possível carregar as formas de pagamento. Tente novamente em instantes.',
  get_card_issuers_failed: 'Não foi possível identificar o banco emissor do cartão. Confira os dados e tente novamente.',
  get_payment_installments_failed: 'Não foi possível consultar as opções de parcelamento. Tente novamente em instantes.',
  get_identification_types_failed: 'Não foi possível carregar os tipos de documento. Tente novamente em instantes.',
  card_token_creation_failed: 'Não foi possível proteger os dados do cartão para concluir o pagamento. Tente novamente.',
  fields_setup_failed: 'Não foi possível carregar o formulário seguro de pagamento. Atualize a página e tente novamente.',
  missing_payment_information: 'Preencha todos os dados do cartão e selecione uma opção de parcelamento.',
  cc_rejected_bad_filled_card_number: 'Confira o número do cartão e tente novamente.',
  cc_rejected_bad_filled_date: 'Confira a data de validade do cartão e tente novamente.',
  cc_rejected_bad_filled_security_code: 'Confira o código de segurança do cartão e tente novamente.',
  cc_rejected_insufficient_amount: 'O cartão não possui limite disponível para este pagamento. Tente outro cartão.',
  cc_rejected_card_disabled: 'Este cartão está desabilitado para a compra. Entre em contato com o banco ou tente outro cartão.',
  cc_rejected_call_for_authorize: 'O banco precisa autorizar esta compra. Entre em contato com o banco e tente novamente.',
  cc_rejected_high_risk: 'O pagamento não foi autorizado por segurança. Tente outro cartão.',
  cc_rejected_max_attempts: 'O limite de tentativas com este cartão foi atingido. Tente outro cartão.',
  cc_rejected_duplicated_payment: 'Um pagamento igual já foi realizado. Confira seus pagamentos antes de tentar novamente.',
};

function textosDoErro(erro) {
  return [
    erro?.type,
    erro?.code,
    erro?.message,
    erro?.cause,
    erro?.error,
    erro?.status_detail,
    erro?.statusDetail,
    ...(Array.isArray(erro?.errors) ? erro.errors.flatMap((item) => [item?.code, item?.message, item?.cause]) : []),
  ]
    .filter(Boolean)
    .map((valor) => typeof valor === 'string' ? valor.toLowerCase() : '')
    .filter(Boolean);
}

export function mensagemAmigavelPagamento(erro) {
  const textos = textosDoErro(erro);
  const codigo = Object.keys(MENSAGENS_POR_CODIGO)
    .find((chave) => textos.some((texto) => texto.includes(chave)));

  return MENSAGENS_POR_CODIGO[codigo]
    || 'Não foi possível validar os dados do cartão. Confira as informações e tente novamente.';
}
