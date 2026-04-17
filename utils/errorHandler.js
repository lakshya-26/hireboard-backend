import fs from 'fs';

/** @type {((req, error, response) => void) | null} */
let errorHandlerCallback = null;

/**
 * Register callback invoked on each handled route error (logging, monitoring, etc.).
 */
export function registerErrorHandlerCallback(cb) {
  errorHandlerCallback = cb;
}

/**
 * Application error with HTTP status and optional validation `errors` array.
 */
export function CustomException(message, statusCode = 422, errors) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.name = 'CustomException';
  if (errors !== undefined) {
    err.errors = errors;
  }
  return err;
}

export async function commonErrorHandler(
  req,
  res,
  message,
  statusCode,
  error = null,
) {
  if (req.files) {
    Object.keys(req.files).forEach((key) => {
      const file = req.files[key];
      const paths = Array.isArray(file) ? file.map((f) => f.path) : [file?.path];
      paths.forEach((p) => {
        if (p) {
          fs.unlink(p, (unlinkErr) => {
            if (unlinkErr) console.error(unlinkErr);
          });
        }
      });
    });
  }

  const errorMessage =
    message || error?.message || 'Something went wrong. Please try again';

  let resolvedStatus = statusCode;
  if (resolvedStatus == null || resolvedStatus === undefined) {
    resolvedStatus = error?.statusCode;
  }
  if (resolvedStatus == null || resolvedStatus === undefined) {
    resolvedStatus = 500;
  }

  req.error = error;

  const response = {
    data: {},
    message: errorMessage,
  };

  if (error?.errors) {
    response.errors = error.errors;
  }

  if (typeof errorHandlerCallback === 'function') {
    errorHandlerCallback(
      req,
      error,
      JSON.parse(JSON.stringify({ ...response, statusCode: resolvedStatus })),
    );
  }

  return res.status(resolvedStatus).json(response);
}
