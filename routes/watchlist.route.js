// routes/watchlist.route.js
import express from 'express';
import * as watchlistModel from '../models/watchlist.model.js';

const router = express.Router();

router.post('/add', async (req, res) => {
  const { course_id, course_title } = req.body;

  const existed = await watchlistModel.isInWatchlist(course_id);
  if (!existed) await watchlistModel.add(course_id, course_title);

  // Trả về 1 dòng thông báo như bạn muốn
  return res.send(`
    <div style="padding:20px;text-align:center;font-family:sans-serif">
      <h5>✅ Đã thêm "<b>${course_title}</b>" vào danh sách yêu thích.</h5>
      <a href="/courses/${course_id}" class="btn btn-outline-primary" style="margin-top:12px">← Quay lại</a>
    </div>
  `);
});

export default router;
