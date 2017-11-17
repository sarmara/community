var mongoose = require('../modules/database.js');
var moment = require('moment');
moment.locale('zh-cn');

var schema = new mongoose.Schema({
    articleId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'articles'
    },
    content: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    },
    agreeCount: {
        type: Number,
        default: 0
    },
    status: {
        type: Number,
        default: 0
    },
    secondReplyCount: {
        type: Number,
        default: 0
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'replies',
        default: null
    },
    createTime: {
        type: Date,
        default: Date.now
    },
    updateTime: {
        type: Date,
        default: Date.now
    }
});

schema.virtual('createTimeFormat').get(function () {
    return moment(this.createTime).startOf('hour').fromNow();
})



schema.statics = {
    add: function (data, cb) {
        var reply = Model.create(data);
        if (data.parentId) {
            var updateCount = Model.findByIdAndUpdate(data.parentId, {$inc:{secondReplyCount:1}});//increase
            Promise.all([reply, updateCount]).then(function (results) {
                return cb(null, { code: 200, message: results })
            }).catch(function (err) {
                return cb({ code: 201, message: err });
            })
        } else {
            Promise.all([reply]).then(function (results) {
                return cb(null, { code: 200, message: results })
            }).catch(function (err) {
                return cb({ code: 201, message: err });
            })
        }
    }
}

var Model = mongoose.model('replies', schema);

module.exports = Model;