import * as catalogService from '../services/catalog.service.js';

export async function home(req, res, next) {
  try { return res.render('home', await catalogService.homeCatalog()); }
  catch (error) { return next(error); }
}
