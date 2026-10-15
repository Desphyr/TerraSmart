import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    type: { type: String, enum: ['cost', 'income'], required: true },
    category: { type: String, trim: true }, // contoh: pupuk, bibit, hasil panen
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now, index: true },
    season: { type: String, trim: true, default: 'current' }, // contoh: "2026-Musim-1"
    description: { type: String, trim: true },
  },
  { timestamps: true }
)

export default mongoose.model('Transaction', transactionSchema)