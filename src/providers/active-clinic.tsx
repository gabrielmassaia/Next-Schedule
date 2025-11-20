"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { authClient } from "@/lib/auth-client";
import type { ClinicSummary } from "@/lib/clinic-session";

interface ActiveClinicContextValue {
  clinics: ClinicSummary[];
  activeClinicId: string | null;
  activeClinic: ClinicSummary | null;
  isLoading: boolean;
  setActiveClinic: (clinicId: string) => Promise<void>;
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

      const userClinics = (session.data?.user?.clinics ??
        []) as ClinicSummary[];
      setClinics(userClinics);
      setIsLoading(true);

      try {
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
        const activeClinicFromCookie = userClinics.find(
          (clinic) => clinic.id === data.activeClinicId,
        );
        setActiveClinicId(
          activeClinicFromCookie?.id ?? userClinics[0]?.id ?? null,
        );
        setActiveClinic(activeClinicFromCookie ?? userClinics[0] ?? null);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setActiveClinicId(userClinics[0]?.id ?? null);
        setActiveClinic(userClinics[0] ?? null);
        setIsLoading(false);
      }
    };

    fetchActiveClinic();
  }, [session.data?.user]);

  const contextValue = useMemo(
    () => ({
      clinics,
      activeClinicId,
      activeClinic,
      isLoading,
      setActiveClinic: setActiveClinicHandler,
    }),
    [clinics, activeClinicId, activeClinic, isLoading, setActiveClinicHandler],
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
