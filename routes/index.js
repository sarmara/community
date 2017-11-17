//引入第三方框架模块和自定义模块 
var express = require('express');
var router = express.Router();
//#region  自定义模块 
var Article = require('../models/article.js');
var mongoose = require('../modules/database.js');
var Category = require('../models/category.js');
var Reply = require('../models/reply.js');
var Page = require('../modules/page.js');
//#endregion 
//‘URL占位符’  格式 ：+变量名 
//req.params.变量名       ？表示此URL占位符可传可不传 
router.get('/:page?', function (req, res, next) {
  // req.query获取的是客户端发送过来的key/value
  // 如果form表单发送是get请求，默认会把form表单中的数据转换成？name=dsh&age=33这种格式，服务器用req.query接收
  // post请求，form表单中的数据转换成json对象传递服务器，用req.body
  // 如果客户端ajax请求，get用req.query，post用req.body 
  var category = req.query.category;
  var currentPage = req.params.page || 1;
  currentPage = parseInt(currentPage);

  var filter = { status: 0 }

  Category.find().sort({ _id: -1 })
    .then(function (categories) {
      // 如果category变量没有值，取数据的最后一个数据赋值给他
      if (!category) {
        category = categories[categories.length - 1]._id;
      }
      filter.category = category;
      // 查询满足filter条件的数据个数
      var totalPromise = Article.find(filter).count();
      // 查询满足filter条件的数据
      var articlePromise = Article.find(filter)
        .skip((currentPage - 1) * 3)
        .limit(3)
        .sort({ createTime: -1 })
        .populate('category')
        .populate('userId')
        .populate('lastReplyId')
        //promise并行异步执行多个任务，若有一个任务失败就失败 
      Promise.all([totalPromise, articlePromise])
        .then(function (results) {
          // console.log(results[1]);
          var totalPage = Math.ceil(results[0] / 3);
          res.render('index', {
            title: '发现',
            user: req.session.user,
            articles: results[1],
            categories,
            currentCategory: category,
            pages: Page.getPages(currentPage, totalPage), // 视图上显示的页码数字集合
            totalPage: totalPage, // 总页数
            currentPage: currentPage // 当前的页码
          });
        }).catch(function (err) {
          res.json({ code: 201, message: err });
        })
    }).catch(function (err) {
      res.json({ code: 201, message: err });
    })

  /*
      Category
        .find()
        .sort({ _id: -1 })
        .exec(function (err, categories) {
          if (!category) {
            category = categories[categories.length - 1]._id;
          }
          filter.category = category;
          Article.find(filter)
            .count()
            .exec(function (err, total) {
              var totalPage = Math.ceil(total / 3);
              // 查询数据
              Article.find(filter)
                // 跨过n条数据
                .skip((currentPage - 1) *3)
                // 限制取n条数据
                .limit(3)
                // 排序
                .sort({ createTime: -1 })
                .populate('category')
                .populate('userId')
                .populate('lastReplyId')
                .exec(function (err, articles) {
                  res.render('index', {
                    title: '发现',
                    user: req.session.user,
                    articles,
                    categories,
                    currentCategory: category,
                    pages: getPages(currentPage, totalPage), // 视图上显示的页码数字集合
                    totalPage: totalPage, // 总页数
                    currentPage: currentPage // 当前的页码
                  });
                })
            })
        })
  */
});



router.get('/test/aa', function (req, res, next) {
  var arr = [
    { name: '分享' },
    { name: '问答' },
    { name: '招聘' }
  ]
  Category.insertMany(arr, function (err, result) {
    res.json({ code: 200, message: 'success' });
  })
})

module.exports = router;
