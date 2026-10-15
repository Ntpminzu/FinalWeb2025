// Isolated, disposable PostgreSQL: this entrypoint never opens the configured Supabase connection.
process.env.NODE_ENV = 'test';
process.env.SESSION_COOKIE_SECURE = 'false';
process.env.PORT = '4100';
process.env.FRONTEND_ORIGINS = 'http://127.0.0.1:5174,http://127.0.0.1:4100';
const { mkdtemp, rm } = await import('node:fs/promises');
const { tmpdir } = await import('node:os');
const path = await import('node:path');
const uploads = await mkdtemp(path.join(tmpdir(), 'academy-demo-'));
process.env.UPLOAD_ROOT = uploads;
const { default: db } = await import('../src/config/database.js');
const { default: bcrypt } = await import('bcrypt');
const { postgres } = await import('../tests/helpers/embedded-db.js');
const { default: app } = await import('../src/app.js');

await db.migrate.latest();
const hash = await bcrypt.hash('Demo12345!', 4);
for (const [username, permission, name] of [
  ['student', 1, 'Học viên Demo'],
  ['teacher', 2, 'Giảng viên Demo'],
  ['admin', 3, 'Quản trị Demo'],
  ['promotable', 1, 'Học viên mới'],
  ['alumni', 1, 'Học viên đã hoàn thành'],
]) {
  const [user] = await db('users')
    .insert({ username, permission, name, email: `${username}@example.test`, password: hash })
    .returning('*');
  if (permission === 2)
    await db('instructors').insert({
      user_id: user.id,
      bio: 'Giảng viên lập trình web.',
      specialization: 'React và Node.js',
    });
}
await db('categories').insert([
  { id: 1, catname: 'Lập trình' },
  { id: 2, catname: 'ReactJS', parent_id: 1 },
  { id: 3, catname: 'Thiết kế' },
]);
await db('courses').insert([
  {
    id: 1,
    instructor_id: 2,
    category_id: 2,
    title: 'ReactJS từ cơ bản',
    short_desc: 'Component, state và kết nối REST API.',
    full_desc: 'Xây dựng giao diện với ReactJS.\nThực hành component, state và gọi API.',
    price: 250000,
    sale_price: 199000,
    thumbnail: '/imgs/course-placeholder.svg',
    rating_avg: 4.8,
    rating_count: 1,
    Status: true,
  },
  {
    id: 2,
    instructor_id: 2,
    category_id: 1,
    title: 'Node.js và Express',
    short_desc: 'Xây dựng REST API với Express.',
    price: 300000,
    thumbnail: '/imgs/course-placeholder.svg',
  },
]);
const mediaOrigin =
  process.env.SERVE_CLIENT === 'true' ? 'http://127.0.0.1:4100' : 'http://127.0.0.1:5174';
await db('lectures').insert([
  {
    id: 1,
    course_id: 1,
    title: 'Giới thiệu ReactJS',
    video_url: `${mediaOrigin}/media/demo.webm`,
    duration_sec: 10,
    order_index: 1,
  },
  {
    id: 2,
    course_id: 2,
    title: 'Giới thiệu Express',
    video_url: `${mediaOrigin}/media/demo.webm`,
    duration_sec: 10,
    order_index: 1,
  },
]);
await db('purchased').insert({ user_id: 5, course_id: 1, course_title: 'ReactJS từ cơ bản' });
await db('lecture_progress').insert({
  user_id: 5,
  lecture_id: 1,
  last_second: 10,
  watched_percent: 100,
  is_completed: true,
});
await db('feedback').insert({
  user_id: 5,
  course_id: 1,
  rating: 5,
  comment: 'Khóa học hữu ích, dễ thực hành.',
});
for (const [table, value] of [
  ['categories', 3],
  ['courses', 2],
  ['lectures', 2],
])
  await db.raw("SELECT setval(pg_get_serial_sequence(?, 'id'), ?)", [table, value]);
const server = app.listen(4100, '127.0.0.1', () =>
  console.log(
    'Demo API: http://127.0.0.1:4100 | React: http://127.0.0.1:5174 | student / teacher / admin : Demo12345! (disposable data)',
  ),
);
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  server.close();
  server.closeAllConnections();
  await db.destroy();
  await postgres.close();
  // uploads is the exact directory returned by mkdtemp, never a configured user path.
  if (path.dirname(path.resolve(uploads)) !== path.resolve(tmpdir()))
    throw new Error('Unexpected temporary upload path.');
  await rm(uploads, { recursive: true, force: true });
}
process.on('SIGINT', close);
process.on('SIGTERM', close);
