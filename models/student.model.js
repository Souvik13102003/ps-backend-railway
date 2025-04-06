const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  universityRollNo: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  year: {
    type: String,
    required: true,
    enum: ["1st", "2nd", "3rd", "4th"],
  },
  section: {
    type: String,
    required: true,
    trim: true,
    enum: ["A", "B", "C"],
  },
  hasPaid: {
    type: Boolean,
    default: false, // ✅ default: not paid
  },

  
});

module.exports = mongoose.model("Student", studentSchema);
