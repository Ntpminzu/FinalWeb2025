import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import ChatbotRepository from '../repositories/chatbot.repository.js';
import { chatbotConfig } from '../../../config/chatbot.js';

const guides = [
  { name: 'public', paths: ['/courses', '/account/signup', '/account/signin'] },
  { name: 'student', paths: ['/cart', '/student/courses', '/student/watchlist', '/account/profile'] },
  { name: 'instructor', paths: ['/instructor/dashboard', '/instructor/courses', '/instructor/new', '/instructor/profile'] },
  { name: 'admin', paths: ['/admin', '/admin/users', '/admin/courses', '/admin/categories'] },
];

export const fingerprint = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export function plainText(value) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return String(value || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (all, entity) => {
      if (entity[0] !== '#') return entities[entity.toLowerCase()] || all;
      const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ' ';
    }).replace(/\s+/g, ' ').trim();
}

export function courseDocument(course) {
  return {
    id: `course:${course.id}`, audience: 'public', title: plainText(course.title), url: `/courses/${course.id}`,
    text: [
      `Khóa học: ${plainText(course.title)}`,
      `Danh mục: ${plainText(course.category) || 'Chưa cung cấp'}`,
      `Giảng viên: ${plainText(course.instructor_name) || 'Chưa cung cấp'}`,
      `Giá gốc: ${Number(course.price)} VND. Giá hiện tại: ${Number(course.sale_price ?? course.price)} VND.`,
      `Đánh giá: ${Number(course.rating_avg || 0)}/5 (${Number(course.rating_count || 0)} lượt).`,
      `Mô tả ngắn: ${plainText(course.short_desc || course.description) || 'Chưa cung cấp'}`,
      `Nội dung: ${plainText(course.full_desc || course.description || course.short_desc) || 'Chưa cung cấp'}`,
    ].join('\n\n'),
  };
}

export function parseGuide(markdown, guide) {
  const sections = [...markdown.replace(/\r\n?/g, '\n').matchAll(/^## (.+?) \| (\/\S+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
  if (!sections.length) throw new Error(`Hướng dẫn ${guide.name} cần mục dạng ## Tiêu đề | /duong-dan.`);
  const ids = new Set();
  return sections.map(match => {
    if (!guide.paths.includes(match[2]) || !match[3].trim()) throw new Error(`Mục hướng dẫn ${guide.name} có nội dung hoặc đường dẫn không hợp lệ.`);
    const id = `guide:${guide.name}:${fingerprint([match[1].trim(), match[2]]).slice(0, 12)}`;
    if (ids.has(id)) throw new Error(`Mục hướng dẫn ${guide.name} bị trùng tiêu đề và đường dẫn.`);
    ids.add(id);
    return { id, audience: guide.name,
      title: match[1].trim(), url: match[2], text: match[3].trim() };
  });
}

export async function readKnowledge(settings = chatbotConfig, connection) {
  const courses = await ChatbotRepository.publicCourses(connection);
  const documents = courses.map(courseDocument);
  for (const guide of guides) {
    documents.push(...parseGuide(await readFile(path.join(settings.guidesDir, `${guide.name}.md`), 'utf8'), guide));
  }
  return documents;
}

export function chunkDocuments(documents, size = chatbotConfig.chunkSize, overlap = chatbotConfig.overlap) {
  if (!Number.isInteger(size) || !Number.isInteger(overlap) || overlap < 0 || size <= overlap)
    throw new Error('Cần chunkSize > overlap >= 0.');
  return documents.flatMap(document => {
    // Bound very long titles so each chunk still has room for its content.
    const header = `${document.title.slice(0, Math.floor(size / 4))}\n\n`;
    const budget = size - header.length;
    if (budget <= overlap) throw new Error('Chunk size quá nhỏ so với tiêu đề.');
    const parts = [];
    let current = '';
    for (const block of document.text.replace(/\r\n?/g, '\n').split(/\n\s*\n/).map(value => value.trim()).filter(Boolean)) {
      if (block.length > budget) {
        if (current) { parts.push(current); current = ''; }
        for (let offset = 0; offset < block.length; offset += budget - overlap) {
          parts.push(block.slice(offset, offset + budget));
          if (offset + budget >= block.length) break;
        }
      } else if (current && current.length + block.length + 2 > budget) {
        parts.push(current); current = block;
      } else current = current ? `${current}\n\n${block}` : block;
    }
    if (current) parts.push(current);
    return parts.map((text, i) => ({ ...document, id: `${document.id}:chunk:${i + 1}`, text: header + text }));
  });
}
