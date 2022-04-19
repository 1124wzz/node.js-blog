"use strict";

var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test', {
  useMongoClient: true
});
var Schema = mongoose.Schema;
var UserSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  created_time: {
    type: Date,
    "default": Date.now
  },
  change_time: {
    type: Date,
    "default": Date.now
  },
  avatar: {
    type: String,
    "default": '/public/img/avatar-default.png'
  },
  gender: {
    type: Number,
    "enum": [-1, 0, 1],
    "default": -1
  },
  bio: {
    type: String,
    "default": ''
  },
  birthday: {
    type: Date
  },
  status: {
    type: Number,
    "enum": [0, 1, 2],
    "default": 0
  }
});
module.exports = mongoose.model('User', UserSchema);