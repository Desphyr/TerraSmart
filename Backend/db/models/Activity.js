import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    type: {
      type: String,
      enum: ['planting', 'fertilizing', 'irrigation', 'harvest'],
      required: true,
    },
    date: { type: Date, default: Date.now, index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
)

export default mongoose.model('Activity', activitySchema)