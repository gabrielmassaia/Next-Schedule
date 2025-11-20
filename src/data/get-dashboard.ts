import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { and, count, desc, eq, gte, lte, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import {
  appointmentsTable,
  clientsTable,
  professionalsTable,
} from "@/db/schema";

dayjs.extend(utc);
dayjs.extend(timezone);

interface Params {
  from: string;
  to: string;
  clinicId: string;
}

export const getDashboard = async ({ from, to, clinicId }: Params) => {
  const startDate = dayjs(from).startOf("day").toDate();
  const endDate = dayjs(to).endOf("day").toDate();

  const chartStartDate = dayjs().subtract(10, "days").startOf("day").toDate();
  const chartEndDate = dayjs().add(10, "days").endOf("day").toDate();
  const tz = "America/Sao_Paulo";
  const todayStart = dayjs().tz(tz).startOf("day").toDate();
  const todayEnd = dayjs().tz(tz).endOf("day").toDate();
  const [
    [totalRevenue],
    [totalAppointments],
    [totalClients],
    [totalProfessionals],
    topProfessionals,
    topSpecialties,
    todayAppointments,
    dailyAppointmentsData,
  ] = await Promise.all([
    db
      .select({
        total: sum(appointmentsTable.appointmentPriceInCents),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, clinicId),
          gte(appointmentsTable.date, startDate),
          lte(appointmentsTable.date, endDate),
        ),
      ),
    db
      .select({
        total: count(),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, clinicId),
          gte(appointmentsTable.date, startDate),
          lte(appointmentsTable.date, endDate),
        ),
      ),
    db
      .select({
        total: count(),
      })
      .from(clientsTable)
      .where(eq(clientsTable.clinicId, clinicId)),
    db
      .select({
        total: count(),
      })
      .from(professionalsTable)
      .where(eq(professionalsTable.clinicId, clinicId)),
    db
      .select({
        id: professionalsTable.id,
        name: professionalsTable.name,
        avatarImageUrl: professionalsTable.avatarImageUrl,
        specialty: professionalsTable.specialty,
        appointments: count(appointmentsTable.id),
      })
      .from(professionalsTable)
      .leftJoin(
        appointmentsTable,
        and(
          eq(appointmentsTable.professionalId, professionalsTable.id),
          gte(appointmentsTable.date, startDate),
          lte(appointmentsTable.date, endDate),
        ),
      )
      .where(eq(professionalsTable.clinicId, clinicId))
      .groupBy(professionalsTable.id)
      .orderBy(desc(count(appointmentsTable.id)))
      .limit(10),
    db
      .select({
        specialty: professionalsTable.specialty,
        appointments: count(appointmentsTable.id),
      })
      .from(appointmentsTable)
      .innerJoin(
        professionalsTable,
        eq(appointmentsTable.professionalId, professionalsTable.id),
      )
      .where(
        and(
          eq(appointmentsTable.clinicId, clinicId),
          gte(appointmentsTable.date, startDate),
          lte(appointmentsTable.date, endDate),
        ),
      )
      .groupBy(professionalsTable.specialty)
      .orderBy(desc(count(appointmentsTable.id))),
    db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.clinicId, clinicId),
        gte(appointmentsTable.date, todayStart),
        lte(appointmentsTable.date, todayEnd),
      ),
      with: {
        client: true,
        professional: true,
      },
    }),
    db
      .select({
        date: sql<string>`DATE(${appointmentsTable.date})`.as("date"),
        appointments: count(appointmentsTable.id),
        revenue:
          sql<number>`COALESCE(SUM(${appointmentsTable.appointmentPriceInCents}), 0)`.as(
            "revenue",
          ),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, clinicId),
          gte(appointmentsTable.date, chartStartDate),
          lte(appointmentsTable.date, chartEndDate),
        ),
      )
      .groupBy(sql`DATE(${appointmentsTable.date})`)
      .orderBy(sql`DATE(${appointmentsTable.date})`),
  ]);
  return {
    totalRevenue,
    totalAppointments,
    totalClients,
    totalProfessionals,
    topProfessionals,
    topSpecialties,
    todayAppointments,
    dailyAppointmentsData,
  };
};
