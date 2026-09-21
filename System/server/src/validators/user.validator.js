const { body } = require('express-validator');

const registerUserValidator = [
  body('email').isEmail().withMessage('A valid email is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').notEmpty().withMessage('Role is required'),
];

module.exports = {
  registerUserValidator,
};
