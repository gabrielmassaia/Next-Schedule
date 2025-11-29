CREATE TABLE "clinic_features" (
	"clinic_id" uuid PRIMARY KEY NOT NULL,
	"ai_agent" boolean DEFAULT false NOT NULL,
	"automated_scheduling" boolean DEFAULT false NOT NULL,
	"api_key" boolean DEFAULT false NOT NULL,
	"dashboard" boolean DEFAULT false NOT NULL,
	"clients_per_clinic" integer,
	"professionals_per_clinic" integer,
	"sync_with_plan" boolean DEFAULT true NOT NULL,
	"overrides" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clinic_whatsapp_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"phone" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"provider" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "clinic_whatsapp_numbers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "n8n_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid,
	"phone" text,
	"direction" text,
	"payload" jsonb,
	"flow" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clinic_features" ADD CONSTRAINT "clinic_features_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinic_whatsapp_numbers" ADD CONSTRAINT "clinic_whatsapp_numbers_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "n8n_webhook_events" ADD CONSTRAINT "n8n_webhook_events_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE set null ON UPDATE no action;
