export function getPageTitle(pathname: string): string {
  switch (pathname) {
    case "/dashboard":
      return "Dashboard";
    case "/appointments":
      return "Agendamentos";
    case "/professionals":
      return "Profissionais";
    case "/clients":
      return "Clientes";
    case "/clinic-settings":
      return "Configurações da Clínica";
    case "/apikey":
      return "API Key";
    case "/specialties":
      return "Especialidades";
    case "/clinic-persona":
      return "Personalidade IA";
    case "/subscription":
      return "Planos";
    default:
      return "Next Schedule";
  }
}
