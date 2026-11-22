CREATE TABLE "city" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"state_code" varchar(2) NOT NULL,
	CONSTRAINT "city_state_id_unique" UNIQUE("state_code","id"),
	CONSTRAINT "city_state_name_unique" UNIQUE("state_code","name")
);
--> statement-breakpoint
CREATE TABLE "sex_option" (
	"code" varchar(32) PRIMARY KEY NOT NULL,
	"label" varchar(60) NOT NULL,
	CONSTRAINT "sex_option_label_unique" UNIQUE("label")
);
--> statement-breakpoint
CREATE TABLE "state" (
	"code" varchar(2) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "city" ADD CONSTRAINT "city_state_fk" FOREIGN KEY ("state_code") REFERENCES "public"."state"("code");
--> statement-breakpoint
-- BEGIN PROFILE OPTIONS SEED
INSERT INTO "state" ("code", "name") VALUES ('GO', 'Goiás') ON CONFLICT DO NOTHING;
INSERT INTO "city" ("id", "name", "state_code") VALUES
  ('00000000-0000-4000-8000-000000000001', 'Ceres', 'GO'),
  ('00000000-0000-4000-8000-000000000002', 'Rialma', 'GO')
ON CONFLICT DO NOTHING;
INSERT INTO "sex_option" ("code", "label") VALUES
  ('feminino', 'Feminino'),
  ('masculino', 'Masculino'),
  ('intersexo', 'Intersexo'),
  ('outro', 'Outro'),
  ('nao-informar', 'Prefiro não informar')
ON CONFLICT DO NOTHING;
-- END PROFILE OPTIONS SEED
--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "new_state" varchar(2);
--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "new_city" uuid;
--> statement-breakpoint
ALTER TABLE "user_account" ADD COLUMN "new_sex" varchar(32);
--> statement-breakpoint
UPDATE "user_account" u
SET "new_state" = c."state_code", "new_city" = c."id", "new_sex" = s."code"
FROM "city" c, "sex_option" s
WHERE translate(lower(trim(u."state")), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
      IN ('go', 'goias')
  AND c."state_code" = 'GO'
  AND translate(lower(trim(c."name")), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc') =
      translate(lower(trim(u."city")), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc')
  AND translate(lower(trim(s."label")), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc') =
      translate(lower(trim(u."sex")), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc');
--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "user_account" WHERE "new_state" IS NULL OR "new_city" IS NULL OR "new_sex" IS NULL) THEN
    RAISE EXCEPTION 'Perfis antigos sem correspondência. Execute o diagnóstico de cadastro antes da migração.';
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "user_account" DROP COLUMN "state", DROP COLUMN "city", DROP COLUMN "sex";
--> statement-breakpoint
ALTER TABLE "user_account" RENAME COLUMN "new_state" TO "state";
--> statement-breakpoint
ALTER TABLE "user_account" RENAME COLUMN "new_city" TO "city";
--> statement-breakpoint
ALTER TABLE "user_account" RENAME COLUMN "new_sex" TO "sex";
--> statement-breakpoint
ALTER TABLE "user_account" ALTER COLUMN "state" SET NOT NULL, ALTER COLUMN "city" SET NOT NULL, ALTER COLUMN "sex" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_account" ADD CONSTRAINT "user_account_state_fk" FOREIGN KEY ("state") REFERENCES "public"."state"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_account" ADD CONSTRAINT "user_account_city_state_fk" FOREIGN KEY ("state","city") REFERENCES "public"."city"("state_code","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_account" ADD CONSTRAINT "user_account_sex_fk" FOREIGN KEY ("sex") REFERENCES "public"."sex_option"("code") ON DELETE no action ON UPDATE no action;