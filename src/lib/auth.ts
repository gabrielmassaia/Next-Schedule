import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { usersTable, usersToClinicsTable } from "@/db/schema";
import type { ClinicSummary } from "@/lib/clinic-session";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: false,
    schema,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const [userData, clinics] = await Promise.all([
        db.query.usersTable.findFirst({
          where: eq(usersTable.id, user.id),
        }),
        db.query.usersToClinicsTable.findMany({
          where: eq(usersToClinicsTable.userId, user.id),
          with: {
            clinic: {
              with: {
                niche: true,
              },
            },
          },
        }),
      ]);

      const normalizedClinics: ClinicSummary[] = clinics.map((clinic) => {
        const clinicData = clinic.clinic;
        const niche = clinicData?.niche;

        return {
          id: clinic.clinicId,
          name: clinicData?.name ?? "",
          cnpj: clinicData?.cnpj ?? "",
          phone: clinicData?.phone ?? "",
          email: clinicData?.email ?? null,
          addressLine1: clinicData?.addressLine1 ?? "",
          addressLine2: clinicData?.addressLine2 ?? null,
          city: clinicData?.city ?? "",
          state: clinicData?.state ?? "",
          zipCode: clinicData?.zipCode ?? "",
          niche: niche
            ? {
                id: niche.id,
                name: niche.name,
                description: niche.description ?? null,
              }
            : null,
        } satisfies ClinicSummary;
      });

      return {
        user: {
          ...user,
          plan: userData?.plan ?? null,
          clinics: normalizedClinics,
        },
        session,
      };
    }),
  ],
  user: {
    modelName: "usersTable",
    additionalFields: {
      stripeCustomerId: {
        type: "string",
        fieldName: "stripeCustomerId",
        required: false,
      },
      stripeSubscriptionId: {
        type: "string",
        fieldName: "stripeSubscriptionId",
        required: false,
      },
      plan: {
        type: "string",
        fieldName: "plan",
        required: false,
      },
      cpf: {
        type: "string",
        fieldName: "cpf",
        required: false,
      },
      phone: {
        type: "string",
        fieldName: "phone",
        required: false,
      },
      birthDate: {
        type: "string",
        fieldName: "birthDate",
        required: false,
      },
      sex: {
        type: "string",
        fieldName: "sex",
        required: false,
      },
    },
  },
  session: {
    modelName: "sessionsTable",
  },
  account: {
    modelName: "accountsTable",
  },
  verification: {
    modelName: "verificationsTable",
  },
  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => {
        const bcrypt = await import("bcryptjs");
        return await bcrypt.hash(password, 10);
      },
      verify: async ({
        password,
        hash,
      }: {
        password: string;
        hash: string;
      }) => {
        const bcrypt = await import("bcryptjs");
        return await bcrypt.compare(password, hash);
      },
    },
  },
});
