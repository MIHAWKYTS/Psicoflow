// ===========================
// PsicoFlow - Feature Flags
// ===========================
// Centraliza a verificação de feature flags para todo o sistema.
// Os valores são lidos a partir de variáveis de ambiente.

export const featureFlags = {
  /**
   * Habilita o upload de anexos (PDFs) nos prontuários clínicos.
   * Atualmente desabilitado — infraestrutura preparada para ativação futura.
   */
  prontuarioAnexos: process.env.FEATURE_PRONTUARIO_ANEXOS === "true",
} as const;

export type FeatureFlags = typeof featureFlags;
