const { body } = require('express-validator');

const createComplaintValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
];

module.exports = {
  createComplaintValidation,
};
