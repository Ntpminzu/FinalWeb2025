import * as homeService from '../services/home.service.js';

export async function home(req, res, next) {
  try { return res.render('home', await homeService.homeCatalog()); }
  catch (error) { return next(error); }
}
