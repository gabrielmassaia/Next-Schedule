import { cookies } from "next/headers";

export const ACTIVE_CLINIC_COOKIE = "activeClinicId";

export type ClinicSummary = {
  id: string;
  name: string;
};

export function readActiveClinicIdFromCookies() {
  return cookies().get(ACTIVE_CLINIC_COOKIE)?.value ?? null;
}

export function selectActiveClinic(
  clinics: ClinicSummary[],
  cookieClinicId: string | null,
) {
  if (!clinics.length) {
    return { activeClinic: null, activeClinicId: null } as const;
  }

  const clinicFromCookie = cookieClinicId
    ? clinics.find((clinic) => clinic.id === cookieClinicId)
    : undefined;

  if (clinicFromCookie) {
    return {
      activeClinic: clinicFromCookie,
      activeClinicId: clinicFromCookie.id,
    } as const;
  }

  const fallback = clinics[0];
  return {
    activeClinic: fallback,
    activeClinicId: fallback.id,
  } as const;
}
