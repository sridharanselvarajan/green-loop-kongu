const mongoose = require('mongoose');

const ScrapItemSchema = new mongoose.Schema({
  image: String,
  type: String,
  price: Number,
});

module.exports = mongoose.model('ScrapItem', ScrapItemSchema);
