CREATE TABLE "tutorial_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"tutorial_id" text NOT NULL,
	"rating" text NOT NULL,
	"comment" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
