import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const pledges = sqliteTable('pledges', {
  id: text('id').primaryKey(),
  company: text('company').notNull(),
  amountCents: integer('amount_cents').notNull().default(0),
  inKind: text('in_kind').notNull().default(''),
  message: text('message').notNull().default(''),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  createdAt: text('created_at').notNull(),
  status: text('status').notNull().default('published'),
  withdrawalHash: text('withdrawal_hash').notNull(),
}, table => [index('pledges_public_date').on(table.status, table.createdAt)]);
export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: integer('expires_at').notNull(),
});
