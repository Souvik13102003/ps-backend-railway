const mongoose = require("mongoose");

const billingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  paymentMode: {
    type: String,
    enum: ["Cash", "Online"],
    required: true,
  },
  transactionId: {
    type: String,
    default: "",
    trim: true,
  },
  screenshot: {
    type: String,
    default: "",
  },
  foodCoupon: {
    type: Boolean,
    default: false,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  
  billFileName: {
    type: String,
    default: '',
  },
});

module.exports = mongoose.model("Billing", billingSchema);
