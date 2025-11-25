import dayjs from "dayjs";
import locale from "dayjs/locale/pt-br";
import utc from "dayjs/plugin/utc";

import { professionalsTable } from "@/db/schema";

dayjs.extend(utc);
dayjs.locale(locale);

export const getAvailability = (
  professional: typeof professionalsTable.$inferSelect,
) => {
  const dayLabels: { [key: number]: string } = {
    0: "Dom",
    1: "Seg",
    2: "Ter",
    3: "Qua",
    4: "Qui",
    5: "Sex",
    6: "Sáb",
  };

  const workingDaysLabels = professional.workingDays
    .sort()
    .map((day) => dayLabels[day])
    .join(", ");

  return {
    workingDaysLabels,
    availableFromTime: professional.availableFromTime,
    availableToTime: professional.availableToTime,
  };
};
