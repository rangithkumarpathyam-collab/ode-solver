import mongoose from 'mongoose';
import { createMockModel } from '../mockDb';

const historySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  equation: { type: String, required: true },
  type: { type: String },
  solution_latex: { type: String },
  steps: [{
    step: String,
    latex: String
  }]
}, { timestamps: true });

export const History: any = process.env.MONGO_URI 
  ? mongoose.model('History', historySchema)
  : createMockModel('history');
