CREATE TABLE `pledges` (
	`id` text PRIMARY KEY NOT NULL,
	`company` text NOT NULL,
	`amount_cents` integer DEFAULT 0 NOT NULL,
	`in_kind` text DEFAULT '' NOT NULL,
	`message` text DEFAULT '' NOT NULL,
	`contact_name` text NOT NULL,
	`contact_email` text NOT NULL,
	`created_at` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`withdrawal_hash` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `pledges_public_date` ON `pledges` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
