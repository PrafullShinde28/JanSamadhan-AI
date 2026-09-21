const { body, param } = require('express-validator');

const createWorkerValidator = [
  body('name').notEmpty().withMessage('Worker name is required'),
  body('department').isMongoId().withMessage('Valid department ID is required'),
  body('email').isEmail().withMessage('A valid email is required'),
];

const workerIdParamValidator = [
  param('id').isMongoId().withMessage('Valid worker ID is required'),
];

module.exports = {
  createWorkerValidator,
  workerIdParamValidator,
};
