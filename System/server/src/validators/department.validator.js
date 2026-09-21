const { body, param } = require('express-validator');

const createDepartmentValidator = [
  body('name').notEmpty().withMessage('Department name is required'),
  body('description').optional().isString(),
];

const departmentIdParamValidator = [
  param('id').isMongoId().withMessage('Valid department ID is required'),
];

module.exports = {
  createDepartmentValidator,
  departmentIdParamValidator,
};
