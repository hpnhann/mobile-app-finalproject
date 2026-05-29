// Wrapper function để bắt lỗi async/await
const TryCatch = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default TryCatch;
