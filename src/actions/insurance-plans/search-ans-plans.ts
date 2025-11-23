"use server";

/**
 * Integração com a API da ANS (Agência Nacional de Saúde Suplementar)
 * Fonte: Portal Brasileiro de Dados Abertos
 * Endpoint: https://dados.gov.br/api/publico/conjuntos-dados/operadoras-de-planos-de-saude-ativas
 */

interface AnsInsurancePlan {
  id: string;
  name: string;
  ansRegistration: string;
  isManual: boolean;
}

interface AnsApiResponse {
  result: {
    records: Array<{
      _id: number;
      Registro_ANS: string;
      CNPJ: string;
      Razao_Social: string;
      Nome_Fantasia: string;
      Modalidade: string;
      Logradouro: string;
      Numero: string;
      Complemento: string;
      Bairro: string;
      Cidade: string;
      UF: string;
      CEP: string;
      DDD: string;
      Telefone: string;
      Fax: string;
      Endereco_eletronico: string;
      Representante: string;
      Cargo_Representante: string;
      Data_Registro_ANS: string;
    }>;
  };
}

// Fallback com principais operadoras caso a API esteja indisponível
const FALLBACK_PLANS: AnsInsurancePlan[] = [
  { id: "1", name: "UNIMED", ansRegistration: "324027", isManual: false },
  {
    id: "2",
    name: "BRADESCO SAÚDE",
    ansRegistration: "005711",
    isManual: false,
  },
  { id: "3", name: "AMIL", ansRegistration: "326305", isManual: false },
  { id: "4", name: "SULAMERICA", ansRegistration: "005711", isManual: false },
  { id: "5", name: "PORTO SEGURO", ansRegistration: "417173", isManual: false },
  {
    id: "6",
    name: "NOTREDAME INTERMEDICA",
    ansRegistration: "359661",
    isManual: false,
  },
  { id: "7", name: "GOLDEN CROSS", ansRegistration: "326313", isManual: false },
  { id: "8", name: "HAPVIDA", ansRegistration: "368253", isManual: false },
  {
    id: "9",
    name: "PREVENT SENIOR",
    ansRegistration: "417270",
    isManual: false,
  },
  { id: "10", name: "CARE PLUS", ansRegistration: "332810", isManual: false },
];

export async function searchAnsInsurancePlans(
  query: string,
): Promise<AnsInsurancePlan[]> {
  try {
    // API da ANS via Portal Brasileiro de Dados Abertos
    const apiUrl = new URL(
      "https://dados.gov.br/api/publico/conjuntos-dados/operadoras-de-planos-de-saude-ativas",
    );

    // Adiciona parâmetros de busca
    apiUrl.searchParams.append("q", query);
    apiUrl.searchParams.append("limit", "20");

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      // Cache por 1 hora para reduzir chamadas à API
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.warn(
        `ANS API returned status ${response.status}, using fallback data`,
      );
      return filterFallbackPlans(query);
    }

    const data: AnsApiResponse = await response.json();

    if (!data.result?.records || data.result.records.length === 0) {
      return filterFallbackPlans(query);
    }

    // Mapeia os dados da API para o formato esperado
    const plans: AnsInsurancePlan[] = data.result.records.map((record) => ({
      id: record._id.toString(),
      name: record.Nome_Fantasia || record.Razao_Social,
      ansRegistration: record.Registro_ANS,
      isManual: false,
    }));

    return plans;
  } catch (error) {
    console.error("Error fetching from ANS API:", error);
    console.log("Using fallback data due to API error");
    return filterFallbackPlans(query);
  }
}

function filterFallbackPlans(query: string): AnsInsurancePlan[] {
  const normalizedQuery = query.toLowerCase().trim();
  return FALLBACK_PLANS.filter((plan) =>
    plan.name.toLowerCase().includes(normalizedQuery),
  ).slice(0, 10);
}

export async function getTopInsurancePlans(): Promise<AnsInsurancePlan[]> {
  // Retorna as principais operadoras do fallback
  return FALLBACK_PLANS.slice(0, 5);
}
