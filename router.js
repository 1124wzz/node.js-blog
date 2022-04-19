var express = require('express')
const user = require('./models/user')
const topic = require('./models/topic')
const md5 = require('blueimp-md5')
const session = require('express-session')
const { json } = require('body-parser')
const markdown = require('markdown').markdown
const comment = require('./models/comment')
const pagination = require('mongoose-sex-page')


var router = express.Router()

// 渲染首页，吧查询到的文章用mongoose-sex-page进行分页
router.get('/', async(req, res) => {
    let page = req.query.page // 获取当前页数的参数page
    const users = await pagination(topic).find().page(page).size(5).display(3).exec() // 进行查询
    res.render('index.html', {
        data: users,
        user: req.session.user
    })

})

// 渲染登陆页面
router.get('/login', (req, res) => {
    res.render('login.html')
})

// 处理登录请求
router.post('/login', (req, res) => {
    const body = req.body // 解析post请求体
        // 去数据库查询这个用户是否存在
    user.findOne({
        email: body.email,
        password: body.password
    }, (err, data) => {
        if (err) {
            return res.status(500).json({ // 给前端发送状态码，有前端判断做出响应的响应
                err_code: 500,
                message: '服务端发生错误'
            })

        }
        if (!data) {
            return res.json({
                err_code: 0,
                message: '邮箱或者密码错误'
            })
        }
        req.session.user = data
        res.json({
            err_code: 1,
            message: 'OK'
        })
    })
})

// 渲染注册页面
router.get('/register', (req, res) => {
    res.render('register.html')
})


// 处理注册请求
router.post('/register', (req, res) => {

    const body = req.body
        // 从数据从中查询这个注册用户是否存在，不存在就注册成功就直接登录成功了，否侧失败
    user.findOne({
        $or: [{
                email: body.email
            },
            {
                nickname: body.nickname
            }
        ]
    }, function(err, data) {
        if (err) {
            return res.json({
                success: false,
                err_code: 500,
            })
        }
        if (data) {
            res.json({
                err_code: 0,
                message: 'Email or nickname exit'
            })
        }
        // 利用 md5 方法将密码进行二次加密
        body.password = md5(md5(body.password))
        new user(body).save(function(err, user) {
            if (err) {
                return res.json({
                    success: false,
                    err_code: 500,
                })
            }
            // 将注册成功的这个用户的信息保存到 session 对象中去
            req.session.user = user
            res.json({
                err_code: 1,
                message: 'OK'
            })
        })
    })
})

// 退出登录
router.get('/logout', (req, res) => {
    req.session.user = null // 将session中的user设置为空
    res.redirect('/login')
})


// 渲染发布文章的页面
router.get('/new', (req, res) => {
    res.render('topic/new.html', {
        user: req.session.user
    })
})

// 处理发布的文章，将文章 保存在数据库中
router.post('/new', (req, res) => {
    const body = req.body
    new topic(body).save(function(err, data) {
        if (err) {
            return res.status(500).json({
                success: false,
                err_code: 500,
            })
        }
        res.status(200).json({
            err_code: 1,
            message: 'OK'
        })
    })
})

// 渲染文章详情页面，将点击的文章的内容和品论展示
router.get('/show', async(req, res) => {
    req.session.postId = req.query.id // 将文章的id给评论的postId,用这个id去查询当前文章的评论
    let data = await topic.findById(req.query.id).exec()
    let reply = await comment.find({ postId: req.query.id }).exec()
    data.content = markdown.toHTML(data.content)
    reply.forEach(element => {
        element.reply = markdown.toHTML(element.reply)
    });
    res.render('topic/show.html', {
        data: {
            demo: data.content
        },
        index: reply,
        user: req.session.user
    })
})

// 处理发布评论的请求
router.post("/show", (req, res) => {
    if (req.session.user == null) { //先去判断用户是否登录，没有登录就不能发布评论
        return res.json({
            err_code: 400
        })
    }

    // 获取当前用户的用户名，将他保存在数据库中
    const username = req.session.user.nickname
    req.body.nickname = username
    req.body.postId = req.session.postId
    new comment(req.body).save((err, data) => {
        if (err) {
            return res.json({
                success: false,
                err_code: 500,
            })
        }
        res.json({
            err_code: 200,
            success: "OK"
        })
    })
})


// 渲染用户修改信息的页面
router.get('/settings/profile', (req, res) => {
    var data = req.session.user
    res.render('settings/profile.html', {
        data: data,
        user: req.session.user
    })
})

// 将修改后的数据更新到数据库
router.post('/settings/profile', (req, res) => {
    var body = req.body
    user.updateOne({
        nickname: body.nickname,
        bio: body.bio,
        gender: body.gender,
        birthday: body.birthday
    }, function(err, ret) {
        if (err) {
            return res.status(500).json({
                err_code: 500
            })
        }
        res.status(200).json({
            err_code: 1
        })
    })
})

// 渲染修改密码页面
router.get('/settings/admin', (req, res) => {
    res.render('settings/admin.html', {
        user: req.session.user
    })
})

// 修改密码，并将新的密码更新到数据库
router.post('/settings/admin', (req, res) => {
    var body = req.body
    console.log(req.session.user.password);
    if (body.password === req.session.user.password) {
        if (body.new_password1 != body.new_password2) {
            res.json({
                err_code: 100
            })
        } else {
            user.updateOne({
                password: body.new_password1
            }, function(err, ret) {
                if (err) {
                    return res.json({
                        err_code: 500
                    })
                }
                res.json({
                    err_code: 200
                })
            })
        }
    } else {
        res.json({
            err_code: 201
        })
    }

})

// 上传头想
router.post('/upload', (req, res) => {

})

// 删除请求
router.get('/delete', (req, res) => {
    var email = req.session.user.email
    user.deleteOne({
        email: email
    }, (err, data) => {
        if (err) {
            return res.status(500)
        }
        req.session.user = null
        res.redirect('/login')
    })
})

// 个人主页
router.get('/people', (req, res) => {

    res.render('settings/people.html', {
        data: req.session.user,
        user: req.session.user
    })
})

module.exports = router