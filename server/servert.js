const Koa = require('koa')
const Router = require('koa-router')
const http = require('http')
const bodyParser = require('koa-bodyparser')
const app = new Koa()
const model = require('./modelt')
const userRouter = require('./usert')
const Chat = model.getModel('chat')
const routers = new Router()

routers.use('/user', userRouter.routes(), userRouter.allowedMethods())
app.use(bodyParser())
app.use(routers.routes()).use(routers.allowedMethods())

const ServerApp = http.Server(app.callback())
const io = require('socket.io')(ServerApp)

io.on('connection', (socket) => {
    socket.on('sendmsg', (data) => {
        const { from, to, msg } = data
        const chatid = [from, to].Sort().join('_')
        Chat.create({chatid, from, to, content: msg}, (err, doc) => {
            if (!err) {
                console.log(doc, '_doc mean what') 
                io.emit('recvmsg', Object.assign({}, doc._doc))
            }
        })
    })
})

ServerApp.listen(9093, () => {
    console.log('Server is starting at port 3000')
})