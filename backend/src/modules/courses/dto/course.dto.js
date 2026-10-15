

export function courseDto(course) {
  return {
    id: course.id,
    title: course.title,
    shortDescription: course.short_desc || course.description || null,
    price: Number(course.price),
    salePrice: course.sale_price == null ? null : Number(course.sale_price),
    ratingAverage: Number(course.rating_avg || 0),
    ratingCount: Number(course.rating_count || 0),
    category: course.category || null,
    instructorName: course.instructor_name || null,
    thumbnail: course.thumbnail || null,
  };
}

export function courseDetailDto(course) {
  return {
    ...courseDto({
      ...course,
      category: course.category_name || course.category,
    }),
    fullDescription: course.full_desc || course.description || null,
    instructorBio: course.instructor_bio || null,
    instructorSpecialization: course.instructor_specialization || null,
    createdAt: course.created_at,
    updatedAt: course.updated_at,
  };
}

export const managementCourseDto = course => ({ ...courseDto(course), categoryId: course.category_id, instructorId: course.instructor_id, shortDescription: course.short_desc, fullDescription: course.full_desc, isDisabled: Boolean(course.is_disabled), isCompleted: Boolean(course.Status), totalStudents: Number(course.total_students || course.student_count || 0), createdAt: course.created_at, updatedAt: course.updated_at });
