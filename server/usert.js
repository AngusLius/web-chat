const Router = require('koa-router')
const utils = require('utility')
const models = require('./modelt')

const Chat = models.getModel('chat')
const User = models.getModel('user')
const filter = {'_v': 0, 'pwd': 0}
const router = new Router()

router.get('/list', async ctx => {
    const { type } = ctx.querystring
    User.find({ type }, (err, doc) => {
        if (!err) {
            return ctx.json({code: 0, data: doc})
        }
    })
})

router.get('/getmsglist', async ctx => {
    const user = ctx.cookies.userid
    let users = {}
    User.find({}, (err, doc) => {
        doc.forEach(e => {
            users[e.id] = {avatar: e.avatar, name: e.user}
        }) 
        Chat.find({ '$or': [{ from: user, to: user }]}, (err, doc) => {
            return ctx.json({code: 0, users: users, msgs: doc})
        })
    })
})

router.post('/readmsg', async ctx => {
    const user = ctx.cookies.userid
    const { from } = ctx.body
    Chat.find({ from, to: user }, { $set: { read: true } }, { multi: true }, (err, doc) => {
        if (!err) {
            return ctx.json({ code: 0, num: doc.nModified })
        }
        return ctx.json({ code: 0, msg: '修改失败' })
    })
})

router.post('/update', async ctx => {
    const userid = ctx.cookies.userid
    const body = ctx.body    
    User.findByIdAndUpdate(userid, body, (err, doc) => {
        return ctx.json({code: 0, data: doc})
    })
})

router.post('/login', async ctx => {
    const {user, pwd} = ctx.body
    User.findOne({ user, pwd: md5PWD(pwd) }, filter, (err, doc) => {
        if (!err) {
            ctx.cookies.set('userid', doc._id)
            return ctx.json({code: 0, data: doc})
        }
        return ctx.json({code: 1, msg: '用户名或密码错误'})
    })
})

router.post('/register', async ctx => {
    const { user, pwd, type } = ctx.request.body
    await User.findOne({ user }, filter, (err, doc) => {
        if (doc) {
            return ctx.json({code: 1, msg: '用户已注册'})
        }
        User.create({ user, pwd: md5PWD(pwd), type }, (err, newdoc) => {
            if (newdoc) {
                ctx.cookies.set('userid', newdoc._id)
                const { user, type, _id} = newdoc
                return ctx.json({ code: 0, data: { user, type, _id }})
            }
            return ctx.json({code: 1, msg: '后端出错'})
        })
    })
})

router.get('/info', async ctx => {
    const userid = ctx.cookies.userid
    if (!userid) {
        return ctx.json({code: 1})
    }
    User.findOne({ _id: userid }, filter, (err, doc) => {
        if (!err) {
            return ctx.json({code: 0, data: doc})
        }
        return ctx.json({code: 1})
    })
})

function md5PWD(pwd) {
    const salt = 'imooc_is_good_3957x8yza6!@#IUHJh~~'
    return utils.md5(utils.md5(pwd + salt))
}

module.exports = router