import mongoose from 'mongoose';

const timerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  targetDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date }
});

timerSchema.pre('save', function save(next) {
  this.updatedAt = new Date();
  next();
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  timers: [timerSchema]
});

const User = mongoose.model('User', userSchema);
export default User;
