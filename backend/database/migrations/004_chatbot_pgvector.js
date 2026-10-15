export async function up(knex) {
  await knex.raw('CREATE SCHEMA IF NOT EXISTS extensions');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions');
  const { rows } = await knex.raw("SELECT n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'vector'");
  const vectorSchema = rows[0].nspname;
  await knex.schema.withSchema('public').createTable('chatbot_index_state', table => {
    table.smallint('id').primary().defaultTo(1);
    table.text('signature').notNullable();
    table.text('snapshot_hash').notNullable();
    table.text('embedding_model').notNullable();
    table.integer('dimensions').notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.check('id = 1');
    table.check('dimensions = 1024');
  });
  await knex.schema.withSchema('public').createTable('chatbot_chunks', table => {
    table.text('id').primary();
    table.integer('course_id').nullable().references('id').inTable('public.courses').onDelete('CASCADE');
    table.text('audience').notNullable();
    table.text('title').notNullable();
    table.text('url').notNullable();
    table.text('text').notNullable();
    table.text('text_hash').notNullable().index();
    table.specificType('embedding', knex.raw('??.vector(1024)', [vectorSchema]).toString()).notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.check("audience IN ('public', 'student', 'instructor', 'admin')");
    table.check(knex.raw('??.vector_norm(embedding) > 0', [vectorSchema]).toString());
    table.index('audience');
  });
  // Backend uses its server-side PostgreSQL credential. Browser/PostgREST roles get no corpus access.
  for (const table of ['chatbot_chunks', 'chatbot_index_state']) {
    await knex.raw('ALTER TABLE public.?? ENABLE ROW LEVEL SECURITY', [table]);
    await knex.raw('REVOKE ALL ON TABLE public.?? FROM PUBLIC', [table]);
    for (const role of ['anon', 'authenticated']) {
      const existing = await knex('pg_roles').where('rolname', role).first('rolname');
      if (existing) await knex.raw('REVOKE ALL ON TABLE public.?? FROM ??', [table, role]);
    }
  }
}

export async function down(knex) {
  await knex.schema.withSchema('public').dropTable('chatbot_chunks');
  await knex.schema.withSchema('public').dropTable('chatbot_index_state');
  // The vector extension may be shared by other features; never remove it on rollback.
}
