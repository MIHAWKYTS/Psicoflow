interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "PsicoFlow <no-reply@psicoflow.app>";

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
      <p style="margin-top: 24px;">Atenciosamente,<br/>Equipe PsicoFlow</p>
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
      <p style="margin-top: 24px;">Atenciosamente,<br/>Equipe PsicoFlow</p>
    </div>
  `;
}
