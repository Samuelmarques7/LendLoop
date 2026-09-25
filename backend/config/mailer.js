const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

async function enviarEmailRecuperacao(destinatario, token) {
  const frontendUrl = String(process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');
  const linkRecuperacao = `${frontendUrl}/redefinir-senha?token=${token}`;

  await transporter.sendMail({
    from: `"LendLoop" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: 'Recuperação de senha - LendLoop',
    text: `Você solicitou a redefinição da sua senha na LendLoop. Acesse ${linkRecuperacao} em até 1 hora. Se você não fez esta solicitação, ignore esta mensagem.`,
    html: `
      <div style="background:#f3f7f8;padding:32px 16px;font-family:Arial,sans-serif;color:#1A1A1A">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #e5e7eb">
          <div style="background:#032D54;padding:28px 32px;color:#fff"><div style="font-size:26px;font-weight:800">LendLoop</div><div style="margin-top:6px;color:#a7f3d0;font-size:13px">Recuperação segura de acesso</div></div>
          <div style="padding:32px"><h2 style="margin:0;color:#032D54;font-size:24px">Crie uma nova senha</h2><p style="margin:16px 0 0;line-height:1.6;color:#475569">Recebemos uma solicitação para redefinir a senha da sua conta. O botão abaixo ficará disponível por <strong>1 hora</strong>.</p>
          <a href="${linkRecuperacao}" style="display:inline-block;background:#2EC34D;color:#fff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:bold;margin:24px 0">Redefinir minha senha</a>
          <p style="margin:0 0 8px;font-size:12px;color:#64748b">Se o botão não abrir, copie este endereço:</p><p style="margin:0;word-break:break-all;font-size:12px;color:#0073F3">${linkRecuperacao}</p>
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;line-height:1.5;color:#64748b">Se você não solicitou essa alteração, ignore esta mensagem. Sua senha continuará a mesma.</div></div>
        </div>
      </div>
    `
  });
}

module.exports = { enviarEmailRecuperacao };
