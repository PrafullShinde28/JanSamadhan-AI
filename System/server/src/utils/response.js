const ApiResponse = require('./ApiResponse');

const sendSuccess = (res, data = null, message = 'Success', meta = null) => {
  return res.status(200).json(new ApiResponse({ success: true, message, data, meta }));
};

const sendError = (res, statusCode = 500, message = 'Internal Server Error') => {
  return res.status(statusCode).json(new ApiResponse({ success: false, message }));
};

module.exports = {
  sendSuccess,
  sendError,
};
