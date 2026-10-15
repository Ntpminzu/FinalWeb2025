import path from 'node:path';
import { fileURLToPath } from 'node:url';

const coreColumns = {
  users: ['id', 'username', 'name', 'email', 'password', 'permission', 'is_disabled'],
  instructors: ['user_id', 'bio', 'specialization', 'total_students', 'total_courses', 'rating_avg'],
  categories: ['id', 'catname', 'parent_id'],
  courses: ['id', 'title', 'instructor_id', 'category_id', 'price', 'sale_price', 'Status', 'is_disabled', 'short_desc', 'full_desc', 'created_at', 'updated_at', 'view_count'],
  lectures: ['id', 'course_id', 'title', 'video_url', 'duration_sec', 'order_index'],
  purchased: ['id', 'user_id', 'course_id', 'course_title', 'purchased_at'],
  lecture_progress: ['user_id', 'lecture_id', 'last_second', 'watched_percent', 'is_completed'],
  feedback: ['id', 'user_id', 'course_id', 'rating', 'comment', 'created_at'],
  watchlist: ['id', 'user_id', 'course_id', 'course_title', 'added_at'],
};

export async function migrateDatabase(db) {
  if (!await db.schema.hasTable('users')) {
    const [, files] = await db.migrate.latest();
    return { legacyBaseline: false, applied: files };
  }
  const [, pending] = await db.migrate.list();
  const legacyBaseline = pending.some(item => item.file === '001_initial_schema.js');
  if (legacyBaseline) {
    for (const [table, required] of Object.entries(coreColumns)) {
      const columns = await db(table).columnInfo();
      const missing = required.filter(column => !Object.hasOwn(columns, column));
      if (missing.length) throw new Error(`Legacy schema mismatch: ${table} is missing ${missing.join(', ')}. No application migration has been run.`);
    }
  }
  const applied = [];
  for (const migration of pending) {
    if (legacyBaseline && migration.file === '001_initial_schema.js') continue;
    const [, files] = await db.migrate.up({ name: migration.file });
    applied.push(...files);
  }
  return { legacyBaseline, applied };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { default: db } = await import('../src/config/database.js');
  try { console.log(JSON.stringify(await migrateDatabase(db), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { await db.destroy(); }
}
