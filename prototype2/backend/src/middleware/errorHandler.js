function notFoundHandler(req, res) {
  res.status(404).json({
    message: "요청한 경로를 찾을 수 없습니다.",
  });
}

function errorHandler(error, req, res, next) {
  const status = error.status || 500;

  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }

  res.status(status).json({
    message: error.message || "서버 오류가 발생했습니다.",
    details: error.details || null,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};

