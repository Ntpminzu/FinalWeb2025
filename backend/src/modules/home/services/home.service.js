import CategoryRepository from '../../categories/repositories/category.repository.js';
import CourseRepository from '../../courses/repositories/course.repository.js';

export async function homeCatalog() {
  const [outstandingCourses, mostViewedCourses, newestCourses, topCategories] = await Promise.all([
    CourseRepository.findOutstandingPastWeek(), CourseRepository.findMostViewed(10), CourseRepository.findNewest(10), CategoryRepository.findMostEnrolledPastWeek(5),
  ]);
  return { outstandingCourses, mostViewedCourses, newestCourses, topCategories };
}
