"use strict";

var express = require('express');

var user = require('./models/user');

var md5 = require('blueimp-md5');

var session = require('express-session');

var router = express.Router();
router.get('/', function (req, res) {
  console.log(req.session.user);
  res.render('index.html', {
    user: req.session.user
  });
});
router.get('/login', function (req, res) {
  res.render('login.html');
});
router.post('/login', function (req, res) {
  var body = req.body;
  user.findOne({
    email: body.email,
    password: body.password
  }, function (err, data) {
    if (err) {
      return res.status(500).json({
        err_code: 500,
        message: '服务端发生错误'
      });
    }

    if (!data) {
      return res.status(200).json({
        err_code: 0,
        message: '邮箱或者密码错误'
      });
    }

    req.session.user = data;
    res.status(200).json({
      err_code: 1,
      message: 'OK'
    });
  });
});
router.get('/register', function (req, res) {
  res.render('register.html');
});
router.post('/register', function (req, res) {
  var body = req.body;
  user.findOne({
    $or: [{
      email: body.email
    }, {
      nickname: body.nickname
    }]
  }, function (err, data) {
    if (err) {
      return res.status(500).json({
        success: false,
        err_code: 500
      });
    }

    if (data) {
      res.status(200).json({
        err_code: 0,
        message: 'Email or nickname exit'
      }); // return res.send(`邮箱或者密码已存在，请重试`)
    } // 利用 md5 方法将密码进行二次加密


    body.password = md5(md5(body.password));
    new user(body).save(function (err, user) {
      if (err) {
        return res.status(500).json({
          success: false,
          err_code: 500
        });
      } // 将注册成功的这个用户的信息保存到 session 对象中去


      req.session.user = user;
      res.status(200).json({
        err_code: 1,
        message: 'OK'
      }); // 这里是异步提交表单， 服务端重定向是没有作用的，必须要在客服端去重定向
      // res.redirect('/')
    });
  });
});
router.get('/logout', function (req, res) {
  req.session.user = null;
  res.redirect('/login');
});
module.exports = router;