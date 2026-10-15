import db from '../../../config/database.js';
import { vectorLiteral } from '../schemas/vector.schema.js';

export default class ChatbotRepository {
  static publicCourses(connection = db) {
    return connection('courses as c')
      .where('c.is_disabled', false)
      .leftJoin('categories as cat', 'cat.id', 'c.category_id')
      .leftJoin('users as u', 'u.id', 'c.instructor_id')
      .select('c.id', 'c.title', 'c.short_desc', 'c.full_desc', 'c.description',
        'c.price', 'c.sale_price', 'c.rating_avg', 'c.rating_count',
        'cat.catname as category', 'u.name as instructor_name')
      .orderBy('c.id');
  }

  static withIndexLock(work) {
    return db.transaction(async connection => {
      await connection.raw('SET LOCAL search_path TO public, extensions');
      // A transaction lock also protects synchronization across multiple backend processes.
      await connection.raw('SELECT pg_advisory_xact_lock(1893, 20261015)');
      return work(connection);
    });
  }

  static async readIndex(connection = db) {
    const state = await connection('public.chatbot_index_state').where('id', 1).first();
    const chunks = await connection('public.chatbot_chunks').select('id', 'text_hash');
    return { state, chunks };
  }

  static async replaceIndex(chunks, vectors, state, connection) {
    const rows = chunks.map(chunk => {
      const vector = vectors.get(chunk.textHash);
      const courseId = /^course:(\d+):chunk:/.exec(chunk.id)?.[1];
      return { id: chunk.id, course_id: courseId ? Number(courseId) : null,
        audience: chunk.audience, title: chunk.title, url: chunk.url, text: chunk.text,
        text_hash: chunk.textHash, updated_at: connection.fn.now(),
        // Unchanged text reuses the vector inside Postgres; do not download all vectors into JavaScript.
        embedding: vector ? connection.raw('?::vector', [vectorLiteral(vector)])
          : connection.raw('(SELECT embedding FROM public.chatbot_chunks WHERE text_hash = ? LIMIT 1)', [chunk.textHash]) };
    });
    // One statement retains the pre-update snapshot for every reused-vector subquery.
    await connection('public.chatbot_chunks').insert(rows).onConflict('id').merge();
    await connection('public.chatbot_chunks').whereNotIn('id', chunks.map(chunk => chunk.id)).del();
    await connection('public.chatbot_index_state').insert({ id: 1, ...state, updated_at: connection.fn.now() })
      .onConflict('id').merge();
  }

  static async search(vector, role, limit, connection) {
    // Exact cosine search applies permission and current catalog visibility before LIMIT.
    const rows = await connection('public.chatbot_chunks as chunk')
      .select('chunk.id', 'chunk.title', 'chunk.url', 'chunk.text')
      .whereIn('chunk.audience', ['public', role])
      .where(builder => builder.whereNull('chunk.course_id').orWhereExists(
        connection('courses').select(connection.raw('1')).whereRaw('courses.id = chunk.course_id').where('is_disabled', false)))
      .orderByRaw('chunk.embedding <=> ?::vector ASC, chunk.id ASC', [vectorLiteral(vector)])
      .limit(limit);
    return rows.map((row, i) => ({ ...row, citation: `S${i + 1}` }));
  }
}
