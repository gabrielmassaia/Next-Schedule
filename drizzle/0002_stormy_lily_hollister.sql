ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_cpf_unique" UNIQUE("cpf");