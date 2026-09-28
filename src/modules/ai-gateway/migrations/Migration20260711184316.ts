import { Migration } from '@medusajs/framework/mikro-orm/migrations';

export class Migration20260711184316 extends Migration {
  override async up(): Promise<void> {
    // Legacy rows are global and stored in plaintext; they cannot be attributed to a user, so admins re-enter their keys.
    this.addSql(`delete from "ai_gateway_key";`);
    this.addSql(
      `alter table if exists "ai_gateway_key" drop constraint if exists "ai_gateway_key_user_id_unique";`,
    );
    this.addSql(`drop index if exists "IDX_ai_gateway_key_type_unique";`);
    this.addSql(
      `alter table if exists "ai_gateway_key" drop column if exists "type", drop column if exists "key_hash";`,
    );

    this.addSql(
      `alter table if exists "ai_gateway_key" add column if not exists "user_id" text not null, add column if not exists "key_encrypted" text not null;`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ai_gateway_key_user_id_unique" ON "ai_gateway_key" ("user_id") WHERE deleted_at IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`delete from "ai_gateway_key";`);
    this.addSql(`drop index if exists "IDX_ai_gateway_key_user_id_unique";`);
    this.addSql(
      `alter table if exists "ai_gateway_key" drop column if exists "user_id", drop column if exists "key_encrypted";`,
    );

    this.addSql(
      `alter table if exists "ai_gateway_key" add column if not exists "type" text not null, add column if not exists "key_hash" text not null;`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ai_gateway_key_type_unique" ON "ai_gateway_key" ("type") WHERE deleted_at IS NULL;`,
    );
  }
}
