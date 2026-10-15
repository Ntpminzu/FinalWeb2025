

export function purchasedCourseDto(course) {
  return {
    courseId: course.course_id,
    title: course.course_title,
    thumbnail: course.thumbnail || null,
    shortDescription: course.short_desc || null,
    price: Number(course.price || 0),
    salePrice: course.sale_price == null ? null : Number(course.sale_price),
    purchasedAt: course.purchased_at,
    completionPercent: Number(course.completion_percent || 0),
    isCompleted: Boolean(course.is_completed),
  };
}

export function lectureDto(lecture) {
  return {
    id: lecture.id,
    title: lecture.title,
    videoUrl: lecture.video_url || null,
    durationSec: lecture.duration_sec == null ? null : Number(lecture.duration_sec),
    orderIndex: Number(lecture.ord ?? lecture.order_index ?? 0),
  };
}

export function progressDto(progress) {
  return {
    lectureId: progress.lecture_id,
    lastSecond: Number(progress.last_second || 0),
    watchedPercent: Number(progress.watched_percent || 0),
    isCompleted: Boolean(progress.is_completed),
  };
}
