const mongoose = require("mongoose")

mongoose.connect('mongodb://localhost/test', { useMongoClient: true })

const Schema = mongoose.Schema
const tocpicSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    pv: {
        type: Number,
        default: 0
    },
    created_time: {
        type: Date,
        default: Date.now
    },
    change_time: {
        type: Date,
        default: Date.now
    }

})

module.exports = mongoose.model('Topic', tocpicSchema)