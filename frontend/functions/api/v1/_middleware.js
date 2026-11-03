// Runs before every /api/v1/* handler: one error format for all routes (DATABASE_API_DESIGN.md §3).
import { errorResponse } from '../../../server/http.js';

export async function onRequest(context) {
  try {
    return await context.next();
  } catch (err) {
    return errorResponse(err);
  }
}
