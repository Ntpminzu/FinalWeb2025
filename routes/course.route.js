import express from 'express';
import db from '../utils/db.js';
import * as courseModel from '../models/course.model.js';
const router = express.Router();

router.get('/', async (req, res) => {
  const list = await courseModel.findAll();
  res.render('vwCourse/list', {
    layout: 'main',
    courses: list,
  });
});
router.get('/:id', async (req, res) => {
  const course = await courseModel.findById(req.params.id);
  if (!course) return res.status(404).render('404');
  res.render('vwCourse/details', { course });
});
export default router;
