import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  currentPrice: {
    type: Number,
    required: true,
  },
  previousPrice: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

const Stock = mongoose.model('Stock', stockSchema);
export default Stock;
