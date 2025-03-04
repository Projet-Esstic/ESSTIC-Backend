// src/utils/validation.js
import Joi from 'joi';
import mongoose from 'mongoose';

export const validateClass = (data) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().optional(),
    // Add more fields as per your class schema
  });

  return schema.validate(data);
};


export function validateObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}