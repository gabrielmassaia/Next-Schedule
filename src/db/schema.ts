import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const usersTableRelations = relations(usersTable, ({ many }) => ({
  usersToClinics: many(usersToClinicsTable),
}));

export const sessionsTable = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
});

export const accountsTable = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verificationsTable = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const clinicNichesTable = pgTable("clinic_niches", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const serviceTypeEnum = pgEnum("service_type", [
  "convenio",
  "particular",
  "ambos",
]);

export const clinicsTable = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  phone: text("phone").notNull(),
  email: text("email"),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  nicheId: uuid("niche_id")
    .notNull()
    .references(() => clinicNichesTable.id, { onDelete: "restrict" }),
  // Lunch break fields
  hasLunchBreak: boolean("has_lunch_break").default(false).notNull(),
  lunchBreakStart: time("lunch_break_start"),
  lunchBreakEnd: time("lunch_break_end"),
  // Service type and payment
  serviceType: serviceTypeEnum("service_type"),
  paymentMethods: jsonb("payment_methods").$type<string[]>().default([]),
  hasParking: boolean("has_parking").default(false).notNull(),
  timezone: text("timezone").default("America/Sao_Paulo").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersToClinicsTable = pgTable("users_to_clinics", {
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const usersToClinicsTableRelations = relations(
  usersToClinicsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [usersToClinicsTable.userId],
      references: [usersTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [usersToClinicsTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

export const professionalsTable = pgTable("professionals", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  avatarImageUrl: text("avatar_image_url"),
  // Array of working days: 0 - Sunday, 1 - Monday, 2 - Tuesday, 3 - Wednesday, 4 - Thursday, 5 - Friday, 6 - Saturday
  workingDays: integer("working_days").array().notNull(),
  availableFromTime: time("available_from_time").notNull(),
  availableToTime: time("available_to_time").notNull(),
  specialty: text("specialty").notNull(),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  appointmentDuration: integer("appointment_duration"), // In minutes
  cpf: text("cpf"),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const professionalsTableRelations = relations(
  professionalsTable,
  ({ many, one }) => ({
    clinic: one(clinicsTable, {
      fields: [professionalsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
  }),
);

export const clinicNichesTableRelations = relations(
  clinicNichesTable,
  ({ many }) => ({
    clinics: many(clinicsTable),
  }),
);

export const clinicsTableRelations = relations(
  clinicsTable,
  ({ many, one }) => ({
    professionals: many(professionalsTable),
    clients: many(clientsTable),
    appointments: many(appointmentsTable),
    usersToClinics: many(usersToClinicsTable),
    integrationApiKeys: many(integrationApiKeysTable),
    operatingHours: many(clinicOperatingHoursTable),
    insurancePlans: many(clinicInsurancePlansTable),
    specialties: many(specialtiesTable),
    niche: one(clinicNichesTable, {
      fields: [clinicsTable.nicheId],
      references: [clinicNichesTable.id],
    }),
    agentSettings: one(clinicAgentSettingsTable, {
      fields: [clinicsTable.id],
      references: [clinicAgentSettingsTable.clinicId],
    }),
  }),
);

export const clientSexEnum = pgEnum("client_sex", ["male", "female"]);
export const clientStatusEnum = pgEnum("client_status", ["active", "inactive"]);

export const clientsTable = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinicsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phoneNumber: text("phone_number").notNull(),
    cpf: text("cpf"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    sex: clientSexEnum("sex").notNull(),
    status: clientStatusEnum("status").notNull().default("active"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Email único por clínica
    emailClinicUnique: unique().on(table.email, table.clinicId),
    // Telefone único por clínica
    phoneClinicUnique: unique().on(table.phoneNumber, table.clinicId),
  }),
);

export const clientsTableRelations = relations(
  clientsTable,
  ({ one, many }) => ({
    clinic: one(clinicsTable, {
      fields: [clientsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
  }),
);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "completed",
  "cancelled",
]);

export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: timestamp("date").notNull(),
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  clientId: uuid("patient_id")
    .notNull()
    .references(() => clientsTable.id, { onDelete: "cascade" }),
  professionalId: uuid("professional_id")
    .notNull()
    .references(() => professionalsTable.id, { onDelete: "cascade" }),
  status: appointmentStatusEnum("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const appointmentsTableRelations = relations(
  appointmentsTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [appointmentsTable.clinicId],
      references: [clinicsTable.id],
    }),
    client: one(clientsTable, {
      fields: [appointmentsTable.clientId],
      references: [clientsTable.id],
    }),
    professional: one(professionalsTable, {
      fields: [appointmentsTable.professionalId],
      references: [professionalsTable.id],
    }),
  }),
);

export const plansTable = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  priceInCents: integer("price_in_cents"),
  priority: integer("priority").notNull(),
  limits: jsonb("limits").notNull().$type<{
    clinics: number | null;
    professionalsPerClinic: number | null;
    clientsPerClinic: number | null;
  }>(),
  features: text("features").array().notNull(),
  stripePriceId: text("stripe_price_id"),
  stripePriceEnvKey: text("stripe_price_env_key"),
  comingSoon: boolean("coming_soon").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const integrationApiKeysTable = pgTable("integration_api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  hashedKey: text("hashed_key").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
});

export const integrationApiKeysTableRelations = relations(
  integrationApiKeysTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [integrationApiKeysTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

// Clinic Operating Hours Table
export const clinicOperatingHoursTable = pgTable(
  "clinic_operating_hours",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinicsTable.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
    isActive: boolean("is_active").notNull().default(true),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Unique constraint: one entry per clinic per day
    uniqueClinicDay: unique().on(table.clinicId, table.dayOfWeek),
  }),
);

export const clinicOperatingHoursTableRelations = relations(
  clinicOperatingHoursTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [clinicOperatingHoursTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

// Clinic Insurance Plans Table
export const clinicInsurancePlansTable = pgTable("clinic_insurance_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  planName: text("plan_name").notNull(),
  ansRegistration: text("ans_registration"), // ANS registration number
  isManual: boolean("is_manual").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const clinicInsurancePlansTableRelations = relations(
  clinicInsurancePlansTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [clinicInsurancePlansTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

// Specialties Table
export const specialtiesTable = pgTable(
  "specialties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clinicId: uuid("clinic_id").references(() => clinicsTable.id, {
      onDelete: "cascade",
    }), // null for default specialties
    name: text("name").notNull(),
    nicheId: uuid("niche_id").references(() => clinicNichesTable.id, {
      onDelete: "set null",
    }),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Unique constraint: specialty name per clinic
    uniqueClinicSpecialty: unique().on(table.clinicId, table.name),
  }),
);

export const specialtiesTableRelations = relations(
  specialtiesTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [specialtiesTable.clinicId],
      references: [clinicsTable.id],
    }),
    niche: one(clinicNichesTable, {
      fields: [specialtiesTable.nicheId],
      references: [clinicNichesTable.id],
    }),
  }),
);

// Clinic Agent Settings Table (Persona)
export const clinicAgentSettingsTable = pgTable(
  "clinic_agent_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinicsTable.id, { onDelete: "cascade" }),
    assistantTone: text("assistant_tone"),
    welcomeMessage: text("welcome_message"),
    rules: jsonb("rules").$type<Record<string, unknown>>(),
    appointmentFlow: jsonb("appointment_flow").$type<Record<string, unknown>>(),
    forbiddenTopics: jsonb("forbidden_topics").$type<Record<string, unknown>>(),
    availability: text("availability"),
    autoResponsesEnabled: boolean("auto_responses_enabled").default(true),
    language: text("language").default("pt-BR"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    uniqueClinic: unique().on(table.clinicId),
  }),
);

export const clinicAgentSettingsTableRelations = relations(
  clinicAgentSettingsTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [clinicAgentSettingsTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);
