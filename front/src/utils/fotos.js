// Mantém URLs externas e assinadas intactas. O original fica disponível na ampliação.
export function fotoOtimizada(src, largura) {
  if (typeof src !== 'string') return src;
  const prefixo = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?!s--)/;
  return src.replace(prefixo, `$1f_auto,q_auto,c_limit,w_${largura}/`);
}
