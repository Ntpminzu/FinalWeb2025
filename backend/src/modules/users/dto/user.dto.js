

export function userDto(user) {
  const dob = user.dob instanceof Date ? user.dob.toISOString().slice(0, 10) : user.dob || null;
  return { id: user.id, username: user.username, name: user.name, email: user.email, dob, permission: Number(user.permission), role: user.role || ({ 1: 'student', 2: 'instructor', 3: 'admin' })[Number(user.permission)] };
}
