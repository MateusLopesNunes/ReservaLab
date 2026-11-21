CREATE TABLE "auth_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "refresh_token" (
	"digest" varchar(64) PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"consumed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(254) NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"city" varchar(120) NOT NULL,
	"birth_date" date NOT NULL,
	"sex" varchar(60) NOT NULL,
	CONSTRAINT "user_account_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"starts_at" timestamp (3) with time zone NOT NULL,
	"ends_at" timestamp (3) with time zone NOT NULL,
	CONSTRAINT "reservation_ordered_period_ck" CHECK ("reservation"."ends_at" > "reservation"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_user_account_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_session_id_auth_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."auth_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_session_user_index" ON "auth_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_token_session_index" ON "refresh_token" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "reservation_equipment_starts_idx" ON "reservation" USING btree ("equipment_id","starts_at","id");