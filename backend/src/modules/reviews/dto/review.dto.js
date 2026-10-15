

export function feedbackDto(feedback) {
  return {
    studentName: feedback.student_name || null,
    rating: Number(feedback.rating),
    comment: feedback.comment || '',
    createdAt: feedback.created_at,
  };
}
