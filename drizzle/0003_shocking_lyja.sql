ALTER TABLE "tune_order" ADD COLUMN "blackbox_content" text;--> statement-breakpoint
ALTER TABLE "tune_order" ADD COLUMN "cli_dump_filename" text;--> statement-breakpoint
ALTER TABLE "tune_order" ADD COLUMN "cli_dump_file_size" integer;--> statement-breakpoint
ALTER TABLE "tune_order" ADD COLUMN "cli_dump_url" text;--> statement-breakpoint
ALTER TABLE "tune_order" ADD COLUMN "cli_dump_content" text;