CREATE TABLE IF NOT EXISTS "promo_code" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL UNIQUE,
	"type" text NOT NULL DEFAULT 'single',
	"max_uses" integer DEFAULT 1,
	"used_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp DEFAULT now(),
	"valid_until" timestamp,
	"created_by" text,
	"note" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "promo_code_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"promo_code_id" text NOT NULL REFERENCES "promo_code"("id") ON DELETE CASCADE,
	"order_id" text REFERENCES "tune_order"("id") ON DELETE SET NULL,
	"customer_email" text NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "promo_code_code_idx" ON "promo_code" ("code");
CREATE INDEX IF NOT EXISTS "promo_code_usage_code_idx" ON "promo_code_usage" ("promo_code_id");
CREATE INDEX IF NOT EXISTS "promo_code_usage_email_idx" ON "promo_code_usage" ("customer_email");
