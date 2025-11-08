"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

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

const initialValue: ActiveClinicContextValue = {
  clinics: [],
  activeClinicId: null,
  activeClinic: null,
  isLoading: true,
  setActiveClinic: async () => {},
};

export function ActiveClinicProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = authClient.useSession();
  const [value, setValue] = useState<ActiveClinicContextValue>(initialValue);

  useEffect(() => {
    const fetchActiveClinic = async () => {
      if (!session.data?.user) {
        setValue((prev) => ({
          ...prev,
          clinics: [],
          activeClinic: null,
          activeClinicId: null,
          isLoading: false,
        }));
        return;
      }

      setValue((prev) => ({
        ...prev,
        clinics: session.data?.user?.clinics ?? [],
        isLoading: true,
      }));

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
        const clinics = (session.data?.user?.clinics ?? []) as ClinicSummary[];
        const activeClinic = clinics.find(
          (clinic) => clinic.id === data.activeClinicId,
        );
        setValue({
          clinics,
          activeClinicId: activeClinic?.id ?? clinics[0]?.id ?? null,
          activeClinic: activeClinic ?? clinics[0] ?? null,
          isLoading: false,
          setActiveClinic: async (clinicId: string) => {
            const res = await fetch("/api/clinics/active", {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ clinicId }),
            });
            if (!res.ok) {
              throw new Error("Não foi possível alterar a clínica ativa");
            }
            const selectedClinic = clinics.find(
              (clinic) => clinic.id === clinicId,
            );
            setValue((prev) => ({
              ...prev,
              activeClinicId: selectedClinic?.id ?? null,
              activeClinic: selectedClinic ?? null,
            }));
          },
        });
      } catch (error) {
        console.error(error);
        const clinics = (session.data?.user?.clinics ?? []) as ClinicSummary[];
        setValue({
          clinics,
          activeClinicId: clinics[0]?.id ?? null,
          activeClinic: clinics[0] ?? null,
          isLoading: false,
          setActiveClinic: async (clinicId: string) => {
            const res = await fetch("/api/clinics/active", {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ clinicId }),
            });
            if (!res.ok) {
              throw new Error("Não foi possível alterar a clínica ativa");
            }
            const selectedClinic = clinics.find(
              (clinic) => clinic.id === clinicId,
            );
            setValue((prev) => ({
              ...prev,
              activeClinicId: selectedClinic?.id ?? null,
              activeClinic: selectedClinic ?? null,
            }));
          },
        });
      }
    };

    fetchActiveClinic();
  }, [session.data?.user]);

  const contextValue = useMemo(() => value, [value]);

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
