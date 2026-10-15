

export async function up(knex) {
  for (const field of ['username', 'email']) {
    const duplicates = await knex('users').whereNotNull(field).select(knex.raw('LOWER(??)', [field])).groupByRaw('LOWER(??)', [field]).havingRaw('COUNT(*) > 1');
    if (duplicates.length) throw new Error(`Cannot add case-insensitive ${field} uniqueness: resolve ${duplicates.length} duplicate group(s) without deleting user data first.`);
    await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS ?? ON users (LOWER(??))', [`api_users_${field}_lower_unique`, field]);
  }
  // The legacy DB made each course globally unique in watchlist, blocking other students.
  const { rows } = await knex.raw(`SELECT conname FROM pg_constraint
    WHERE conrelid = 'watchlist'::regclass AND contype = 'u'
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'watchlist'::regclass AND attname = 'course_id')]`);
  if (rows.length) {
    await knex.raw('CREATE UNIQUE INDEX IF NOT EXISTS ux_watchlist_user_course ON watchlist (user_id, course_id)');
    for (const row of rows) await knex.schema.alterTable('watchlist', table => table.dropUnique(['course_id'], row.conname));
  }
}

export async function down(knex) {
  for (const field of ['username', 'email']) await knex.raw('DROP INDEX IF EXISTS ??', [`api_users_${field}_lower_unique`]);
  // Do not restore the incorrect course-only constraint: multiple users may now share a course.
}
