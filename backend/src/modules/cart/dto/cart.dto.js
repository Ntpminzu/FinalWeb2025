import { courseDto } from '../../courses/dto/course.dto.js';

export const cartDto = summary => ({ courses: summary.courses.map(courseDto), total: Number(summary.total || 0), empty: summary.empty });
