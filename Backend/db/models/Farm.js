import mongoose from 'mongoose'

const farmSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    area: { type: Number, required: true, min: 0.01 }, // hektare
    cropType: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    locationName: { type: String, trim: true },
  },
  { timestamps: true }
)

export default mongoose.model('Farm', farmSchema)