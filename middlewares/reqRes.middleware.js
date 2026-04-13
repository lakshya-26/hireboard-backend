/**
 * Sends a uniform JSON success body from values set on `req` by controllers.
 */
export function sendResponse(req, res) {
  const statusCode = req.statusCode ?? 200;
  const data = req.data ?? {};
  const message = req.message ?? 'Success';

  return res.status(statusCode).json({
    data,
    message,
  });
}
