

export async function up(knex) {
  await knex.schema.createTable('auth_sessions', table => {
    table.uuid('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('revoked_at', { useTz: true }).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index(['user_id']);
  });
  await knex.schema.createTable('refresh_tokens', table => {
    table.string('token_hash', 64).primary();
    table.uuid('session_id').notNullable().references('id').inTable('auth_sessions').onDelete('CASCADE');
    table.timestamp('used_at', { useTz: true }).nullable();
    table.index(['session_id']);
  });
  await knex.schema.createTable('cart_items', table => {
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.timestamp('added_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.primary(['user_id', 'course_id']);
  });
  // Older installations may already have this table; never recreate or erase it.
  if (!await knex.schema.hasTable('idempotency_keys')) {
    await knex.schema.createTable('idempotency_keys', table => {
      table.increments('id').primary();
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('endpoint', 50).notNullable();
      table.string('idempotency_key', 100).notNullable();
      table.text('request_fingerprint').notNullable();
      table.integer('status_code').notNullable();
      table.jsonb('response_body').notNullable();
      table.unique(['user_id', 'endpoint', 'idempotency_key']);
    });
  }
}

export async function down(knex) {
  for (const table of ['cart_items', 'refresh_tokens', 'auth_sessions']) await knex.schema.dropTableIfExists(table);
  // Keep idempotency history: it may predate this migration.
}
