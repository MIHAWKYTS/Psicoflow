interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "PsiGen <no-reply@psigen.app>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Erro ao enviar e-mail: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

export function buildSessionReminderEmail(patientName: string, sessionDateText: string) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2 style="margin-bottom: 8px;">Lembrete de consulta</h2>
      <p>Olá, ${patientName}.</p>
      <p>Este é um lembrete da sua sessão agendada para <strong>${sessionDateText}</strong>.</p>
      <p>Se precisar remarcar, responda este e-mail com antecedência.</p>
      <p style="margin-top: 24px;">Atenciosamente,<br/>Equipe PsiGen</p>
    </div>
  `;
}

export function buildPasswordResetEmail(nome: string, resetLink: string) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 480px; margin: 0 auto;">
      <div style="background: #0ea5e9; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <span style="font-size: 28px; font-weight: 900; color: white;">Ψ PsiGen</span>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="margin: 0 0 8px; font-size: 20px; color: #1e293b;">Redefinição de senha</h2>
        <p style="color: #64748b; margin: 0 0 24px;">Olá, ${nome}.</p>
        <p style="color: #475569; margin: 0 0 24px;">Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. Este link expira em <strong>1 hora</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}"
             style="background: #0ea5e9; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
            Redefinir minha senha
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px; margin: 0;">Se você não solicitou a redefinição, ignore este e-mail. Sua senha permanece a mesma.</p>
      </div>
    </div>
  `;
}

export function buildMaterialFollowUpEmail(
  patientName: string,
  message: string,
  links: string[],
  pdfUrls: string[]
) {
  const listItems = [...links, ...pdfUrls]
    .map((url) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></li>`)
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2 style="margin-bottom: 8px;">Material complementar pós-sessão</h2>
      <p>Olá, ${patientName}.</p>
      <p>${message}</p>
      ${listItems ? `<ul>${listItems}</ul>` : ""}
      <p style="margin-top: 24px;">Atenciosamente,<br/>Equipe PsiGen</p>
    </div>
  `;
}
