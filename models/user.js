const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const localpassport = require('passport-local-mongoose').default;

// Account data used by Passport Local authentication.
const userSchema = new mongoose.Schema({
  
  email: {
    type: String,
    required: true,
    unique: true
  },
  
});

userSchema.plugin(localpassport);

module.exports = mongoose.model('User', userSchema);    