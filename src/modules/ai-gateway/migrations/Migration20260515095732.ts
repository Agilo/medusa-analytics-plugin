import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260515095732 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "ai_gateway_key" drop constraint if exists "ai_gateway_key_type_unique";`);
    this.addSql(`create table if not exists "ai_gateway_key" ("id" text not null, "type" text not null, "key_hash" text not null, "key_last_four" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "ai_gateway_key_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ai_gateway_key_type_unique" ON "ai_gateway_key" ("type") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ai_gateway_key_deleted_at" ON "ai_gateway_key" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "ai_gateway_key" cascade;`);
  }

}
