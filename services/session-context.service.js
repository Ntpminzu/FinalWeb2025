import CategoryDao from '../daos/category.dao.js';
import PurchasedDao from '../daos/purchased.dao.js';

export const listCategories = () => CategoryDao.all();
export async function ownedCourseIds(userId) {
  return (await PurchasedDao.findOwnedCourseIds(userId)).map(String);
}
