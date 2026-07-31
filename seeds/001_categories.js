export async function seed(knex) {
  const categories = ['Web Development', 'Mobile Development', 'Data Science', 'Design', 'Business'];
  await knex('categories').insert(categories.map(catname => ({ catname }))).onConflict('catname').ignore();
}
