const mongoose = require("mongoose");

const fundSchema = new mongoose.Schema({
  totalFund: {
    type: Number,
    default: 0,
    min: 0,
  },
});

module.exports = mongoose.model("Fund", fundSchema);
