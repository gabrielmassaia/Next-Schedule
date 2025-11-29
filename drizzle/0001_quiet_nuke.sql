CREATE TABLE "legal_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"version" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cpf" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birth_date" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sex" text;