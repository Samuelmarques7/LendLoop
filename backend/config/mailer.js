const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

async function enviarEmailRecuperacao(destinatario, token) {
  const linkRecuperacao = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}`;

  await transporter.sendMail({
    from: `"LendLoop" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: 'Recuperação de senha - LendLoop',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #032D54;">Recuperação de senha</h2>
        <p style="color: #1A1A1A;">Você solicitou a redefinição da sua senha no LendLoop.</p>
        <p style="color: #1A1A1A;">Clique no link abaixo para criar uma nova senha. Ele é válido por 1 hora.</p>
        <a href="${linkRecuperacao}" style="display: inline-block; background-color: #29C354; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
          Redefinir Senha
        </a>
        <p style="color: #666; font-size: 13px;">Se você não solicitou isso, pode ignorar este e-mail.</p>
      </div>
    `
  });
}

module.exports = { enviarEmailRecuperacao };