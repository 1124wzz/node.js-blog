const mongoose = require("mongoose")
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/test', { useMongoClient: true })

const Schema = mongoose.Schema
const CommentSchema = new Schema({
    reply: {
        type: String,
        required: true
    },
    nickname: {
        type: String,
        required: true
    },
    created_time: {
        type: Date,
        default: Date.now
    },
    postId: {
        type: String,
        required: true
    }

})

module.exports = mongoose.model('Comment', CommentSchema)