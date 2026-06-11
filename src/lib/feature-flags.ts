// ===========================
// PsiGen - Feature Flags
// ===========================
// Centraliza a verificação de feature flags para todo o sistema.
// Os valores são lidos a partir de variáveis de ambiente.

export const featureFlags = {
  /**
   * Habilita o upload de anexos (PDFs) nos prontuários clínicos.
   * Atualmente desabilitado — infraestrutura preparada para ativação futura.
   */
  prontuarioAnexos: process.env.FEATURE_PRONTUARIO_ANEXOS === "true",

  /**
   * Habilita o módulo de controle de estoque de insumos.
   * Relevante para clínicas multidisciplinares (odontologia, fisioterapia...).
   * Desabilitado por padrão — não faz sentido para psicólogos individuais.
   */
  estoque: process.env.FEATURE_ESTOQUE === "true",
} as const;

export type FeatureFlags = typeof featureFlags;
