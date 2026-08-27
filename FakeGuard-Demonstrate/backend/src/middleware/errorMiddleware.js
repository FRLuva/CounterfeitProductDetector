export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  if (err.name === "CastError") {
    statusCode = 400;
    err.message = "Invalid resource ID";
  }

  if (err.code === 11000) {
    statusCode = 400;
    err.message = "Duplicate field value entered";
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server Error"
  });
};
