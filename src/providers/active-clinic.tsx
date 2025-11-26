"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getUserClinics } from "@/actions/get-user-clinics/get-user-clinics";
import { authClient } from "@/lib/auth-client";
import type { ClinicSummary } from "@/lib/clinic-session";

interface ActiveClinicContextValue {
  clinics: ClinicSummary[];
  activeClinicId: string | null;
  activeClinic: ClinicSummary | null;
  isLoading: boolean;
  session: ReturnType<typeof authClient.useSession>;
  setActiveClinic: (clinicId: string) => Promise<void>;
  refreshClinics: () => Promise<void>;
}

const ActiveClinicContext = createContext<ActiveClinicContextValue | undefined>(
  undefined,
);

export function ActiveClinicProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = authClient.useSession();
  const [clinics, setClinics] = useState<ClinicSummary[]>([]);
  const [activeClinicId, setActiveClinicId] = useState<string | null>(null);
  const [activeClinic, setActiveClinic] = useState<ClinicSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshClinics = useCallback(async () => {
    try {
      const updatedClinics = await getUserClinics();
      setClinics(updatedClinics);

      const response = await fetch("/api/clinics/active", {
        method: "GET",
        credentials: "include",
      });

      let activeClinicIdFromCookie: string | null = null;
      if (response.ok) {
        const data = (await response.json()) as {
          activeClinicId: string | null;
        };
        activeClinicIdFromCookie = data.activeClinicId;
      }

      const activeClinicFromCookie = updatedClinics.find(
        (clinic) => clinic.id === activeClinicIdFromCookie,
      );

      // Se tivermos uma clínica no cookie e ela existir na lista, usamos ela
      // Se o usuário tiver apenas UMA clínica, auto-seleciona
      // Se tiver múltiplas, aguarda seleção manual (não auto-seleciona)
      const newActiveId =
        activeClinicFromCookie?.id ??
        (updatedClinics.length === 1 ? updatedClinics[0]?.id : null) ??
        null;
      const newActiveClinic =
        activeClinicFromCookie ??
        (updatedClinics.length === 1 ? updatedClinics[0] : null) ??
        null;

      setActiveClinicId(newActiveId);
      setActiveClinic(newActiveClinic);
    } catch (error) {
      console.error("Failed to refresh clinics:", error);
    }
  }, []);

  const setActiveClinicHandler = useCallback(
    async (clinicId: string) => {
      const res = await fetch("/api/clinics/active", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId }),
      });
      if (!res.ok) {
        throw new Error("Não foi possível alterar a clínica ativa");
      }
      // Atualizar estado local
      const selectedClinic = clinics.find((clinic) => clinic.id === clinicId);
      setActiveClinicId(selectedClinic?.id ?? null);
      setActiveClinic(selectedClinic ?? null);
    },
    [clinics],
  );

  useEffect(() => {
    const fetchActiveClinic = async () => {
      if (!session.data?.user) {
        setClinics([]);
        setActiveClinic(null);
        setActiveClinicId(null);
        setIsLoading(false);
        return;
      }

      // Inicializa com os dados da sessão, mas busca atualizados em seguida
      const sessionClinics = (session.data?.user?.clinics ??
        []) as ClinicSummary[];
      setClinics(sessionClinics);
      setIsLoading(true);

      // Safety timeout to ensure we don't get stuck in loading state
      const timeoutId = setTimeout(() => {
        setIsLoading((loading) => {
          if (loading) {
            console.warn("Clinic fetch timed out, using session data");
            return false;
          }
          return loading;
        });
      }, 5000);

      try {
        // Busca clínicas atualizadas do servidor
        const updatedClinics = await getUserClinics();
        setClinics(updatedClinics);

        const response = await fetch("/api/clinics/active", {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Erro ao carregar clínica ativa");
        }
        const data = (await response.json()) as {
          activeClinicId: string | null;
        };

        // Usa a lista atualizada para encontrar a clínica ativa
        const activeClinicFromCookie = updatedClinics.find(
          (clinic) => clinic.id === data.activeClinicId,
        );

        // Se tivermos uma clínica no cookie e ela existir na lista, usamos ela
        // Se o usuário tiver apenas UMA clínica, auto-seleciona
        // Se tiver múltiplas, aguarda seleção manual (não auto-seleciona)
        const newActiveId =
          activeClinicFromCookie?.id ??
          (updatedClinics.length === 1 ? updatedClinics[0]?.id : null) ??
          null;
        const newActiveClinic =
          activeClinicFromCookie ??
          (updatedClinics.length === 1 ? updatedClinics[0] : null) ??
          null;

        setActiveClinicId(newActiveId);
        setActiveClinic(newActiveClinic);
      } catch (error) {
        console.error(error);
        // Fallback: auto-seleciona apenas se tiver uma única clínica
        const fallbackId =
          sessionClinics.length === 1 ? sessionClinics[0]?.id : null;
        const fallbackClinic =
          sessionClinics.length === 1 ? sessionClinics[0] : null;
        setActiveClinicId(fallbackId ?? null);
        setActiveClinic(fallbackClinic ?? null);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    fetchActiveClinic();
  }, [session.data?.user]); // Removido session.data?.user?.clinics para evitar loop se a session mudar constantemente

  const contextValue = useMemo(
    () => ({
      clinics,
      activeClinicId,
      activeClinic,
      isLoading,
      session,
      setActiveClinic: setActiveClinicHandler,
      refreshClinics,
    }),
    [
      clinics,
      activeClinicId,
      activeClinic,
      isLoading,
      session,
      setActiveClinicHandler,
      refreshClinics,
    ],
  );

  return (
    <ActiveClinicContext.Provider value={contextValue}>
      {children}
    </ActiveClinicContext.Provider>
  );
}

export function useActiveClinic() {
  const context = useContext(ActiveClinicContext);
  if (!context) {
    throw new Error(
      "useActiveClinic deve ser utilizado dentro de um ActiveClinicProvider",
    );
  }
  return context;
}
