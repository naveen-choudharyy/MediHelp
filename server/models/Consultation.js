const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: String,
    trim: true
  },
  callStatus: {
    type: String,
    enum: ['idle', 'in-progress', 'completed', 'cancelled'],
    default: 'idle'
  },
  participants: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['doctor', 'patient']
      },
      socketId: {
        type: String
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      leftAt: {
        type: Date
      }
    }
  ],
  duration: {
    type: Number, // duration in seconds
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Consultation', consultationSchema);
