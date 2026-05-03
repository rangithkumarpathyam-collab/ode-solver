import mongoose from 'mongoose';
import { createMockModel } from '../mockDb';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
}, { timestamps: true });

export const User: any = process.env.MONGO_URI 
  ? mongoose.model('User', userSchema) 
  : createMockModel('users');
