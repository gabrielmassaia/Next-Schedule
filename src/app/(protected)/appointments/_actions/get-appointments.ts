"use server";

import { and, count, desc, eq, gte, ilike, lte } from "drizzle-orm";

import { requirePlan } from "@/_helpers/require-plan";
import { db } from "@/db";
import {
  appointmentsTable,
  clientsTable,
  professionalsTable,
} from "@/db/schema";

interface GetAppointmentsParams {
  page?: number;
  limit?: number;
  clientName?: string;
  professionalName?: string;
  date?: string;
  specialty?: string;
}

export async function getAppointments({
  page = 1,
  limit = 30,
  clientName,
  professionalName,
  date,
  specialty,
}: GetAppointmentsParams) {
  const { activeClinic } = await requirePlan();
  if (!activeClinic) {
    return {
      appointments: [],
      totalCount: 0,
      pageCount: 0,
    };
  }

  const offset = (page - 1) * limit;

  const where = and(
    eq(appointmentsTable.clinicId, activeClinic.id),
    clientName ? ilike(clientsTable.name, `%${clientName}%`) : undefined,
    professionalName
      ? ilike(professionalsTable.name, `%${professionalName}%`)
      : undefined,
    specialty
      ? ilike(professionalsTable.specialty, `%${specialty}%`)
      : undefined,
    date
      ? and(
          gte(appointmentsTable.date, new Date(`${date}T00:00:00`)),
          lte(appointmentsTable.date, new Date(`${date}T23:59:59`)),
        )
      : undefined,
  );

  const [appointments, totalCount] = await Promise.all([
    db
      .select({
        id: appointmentsTable.id,
        date: appointmentsTable.date,
        appointmentPriceInCents: appointmentsTable.appointmentPriceInCents,
        clinicId: appointmentsTable.clinicId,
        clientId: appointmentsTable.clientId,
        professionalId: appointmentsTable.professionalId,
        createdAt: appointmentsTable.createdAt,
        updatedAt: appointmentsTable.updatedAt,
        client: {
          id: clientsTable.id,
          name: clientsTable.name,
          email: clientsTable.email,
          phoneNumber: clientsTable.phoneNumber,
          sex: clientsTable.sex,
          status: clientsTable.status,
        },
        professional: {
          id: professionalsTable.id,
          name: professionalsTable.name,
          specialty: professionalsTable.specialty,
          avatarImageUrl: professionalsTable.avatarImageUrl,
        },
      })
      .from(appointmentsTable)
      .leftJoin(clientsTable, eq(appointmentsTable.clientId, clientsTable.id))
      .leftJoin(
        professionalsTable,
        eq(appointmentsTable.professionalId, professionalsTable.id),
      )
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(appointmentsTable.date)),
    db
      .select({ count: count() })
      .from(appointmentsTable)
      .leftJoin(clientsTable, eq(appointmentsTable.clientId, clientsTable.id))
      .leftJoin(
        professionalsTable,
        eq(appointmentsTable.professionalId, professionalsTable.id),
      )
      .where(where)
      .then((res) => res[0].count),
  ]);

  const pageCount = Math.ceil(totalCount / limit);

  return {
    appointments,
    totalCount,
    pageCount,
  };
}
