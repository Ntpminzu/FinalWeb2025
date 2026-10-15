import db from '../../config/database.js';

export const transaction = operation => db.transaction(operation);

