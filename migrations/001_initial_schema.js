export async function up(knex) {
  await knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('username', 32).notNullable().unique();
    table.string('name', 100).notNullable();
    table.string('email', 254).notNullable().unique();
    table.string('password', 255).notNullable();
    table.date('dob').nullable();
    table.integer('permission').notNullable().defaultTo(1);
    table.string('role', 20).nullable();
    table.boolean('is_disabled').notNullable().defaultTo(false);
    table.timestamps(true, true);
  });
  await knex.raw('ALTER TABLE users ADD CONSTRAINT users_permission_check CHECK (permission IN (1, 2, 3))');

  await knex.schema.createTable('instructors', table => {
    table.integer('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.text('bio').nullable();
    table.string('specialization', 200).nullable();
    table.integer('total_students').notNullable().defaultTo(0);
    table.integer('total_courses').notNullable().defaultTo(0);
    table.decimal('rating_avg', 3, 2).notNullable().defaultTo(0);
  });

  await knex.schema.createTable('categories', table => {
    table.increments('id').primary();
    table.string('catname', 100).notNullable().unique();
    table.integer('parent_id').nullable().references('id').inTable('categories').onDelete('SET NULL');
  });

  await knex.schema.createTable('courses', table => {
    table.increments('id').primary();
    table.integer('instructor_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.integer('category_id').nullable().references('id').inTable('categories').onDelete('SET NULL');
    table.string('title', 200).notNullable();
    table.text('short_desc').nullable();
    table.text('full_desc').nullable();
    table.text('description').nullable();
    table.decimal('price', 12, 2).notNullable().defaultTo(0);
    table.decimal('sale_price', 12, 2).nullable();
    table.string('thumbnail', 500).nullable();
    table.boolean('is_disabled').notNullable().defaultTo(false);
    table.boolean('Status').notNullable().defaultTo(false);
    table.decimal('rating_avg', 3, 2).notNullable().defaultTo(0);
    table.integer('rating_count').notNullable().defaultTo(0);
    table.integer('view_count').notNullable().defaultTo(0);
    table.integer('student_count').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('lectures', table => {
    table.increments('id').primary();
    table.integer('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.string('title', 200).notNullable();
    table.string('video_url', 2000).nullable();
    table.integer('duration_sec').nullable();
    table.integer('order_index').notNullable().defaultTo(0);
  });

  await knex.schema.createTable('purchased', table => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.string('course_title', 200).nullable();
    table.timestamp('purchased_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(['user_id', 'course_id']);
  });

  await knex.schema.createTable('lecture_progress', table => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('lecture_id').notNullable().references('id').inTable('lectures').onDelete('CASCADE');
    table.integer('last_second').notNullable().defaultTo(0);
    table.decimal('watched_percent', 5, 2).notNullable().defaultTo(0);
    table.boolean('is_completed').notNullable().defaultTo(false);
    table.unique(['user_id', 'lecture_id']);
  });

  await knex.schema.createTable('feedback', table => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.integer('rating').notNullable();
    table.text('comment').notNullable().defaultTo('');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(['user_id', 'course_id']);
  });
  await knex.raw('ALTER TABLE feedback ADD CONSTRAINT feedback_rating_check CHECK (rating BETWEEN 1 AND 5)');

  await knex.schema.createTable('watchlist', table => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('course_id').notNullable().references('id').inTable('courses').onDelete('CASCADE');
    table.string('course_title', 200).nullable();
    table.timestamp('added_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.unique(['user_id', 'course_id']);
  });

  await knex.raw(`
    CREATE FUNCTION refresh_course_rating() RETURNS trigger AS $$
    DECLARE target_course_id integer;
    BEGIN
      target_course_id := COALESCE(NEW.course_id, OLD.course_id);
      UPDATE courses SET
        rating_avg = COALESCE((SELECT AVG(rating) FROM feedback WHERE course_id = target_course_id), 0),
        rating_count = (SELECT COUNT(*) FROM feedback WHERE course_id = target_course_id)
      WHERE id = target_course_id;
      RETURN COALESCE(NEW, OLD);
    END;
    $$ LANGUAGE plpgsql;
    CREATE TRIGGER feedback_refresh_course_rating
    AFTER INSERT OR UPDATE OR DELETE ON feedback
    FOR EACH ROW EXECUTE FUNCTION refresh_course_rating();
  `);
}

export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS feedback_refresh_course_rating ON feedback');
  await knex.raw('DROP FUNCTION IF EXISTS refresh_course_rating');
  for (const table of ['watchlist', 'feedback', 'lecture_progress', 'purchased', 'lectures', 'courses', 'categories', 'instructors', 'users']) {
    await knex.schema.dropTableIfExists(table);
  }
}
