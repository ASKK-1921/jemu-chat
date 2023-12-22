const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { Server } = require('socket.io');
const session = require('express-session');
const mongoose = require('./database');

const app = express();
const port = 3000;

const middleware = require('./middleware');

const server = app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
const io = new Server(server, { pingTimeout: 60000 });

app.set('view engine', 'pug');
app.set('views', 'views');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
	session({
		secret: 'Jessie and Mugi',
		resave: true,
		saveUninitialized: false,
	})
);

// Routes
const loginRoutes = require('./routes/loginRoutes');
const logoutRoutes = require('./routes/logoutRoutes');
const registerRoutes = require('./routes/registerRoutes');
const postRoutes = require('./routes/postRoutes');
const profileRoutes = require('./routes/profileRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const searchRoutes = require('./routes/searchRoutes');
const messagesRoutes = require('./routes/messageRoutes');
const notificationsRoutes = require('./routes/notificationsRoutes');
const postsApiRoutes = require('./routes/api/postsApiRoutes');
const usersApiRoutes = require('./routes/api/usersApiRoutes');
const chatsApiRoutes = require('./routes/api/chatsApiRoutes');
const messagesApiRoutes = require('./routes/api/messagesApiRoutes');
const notificationsApiRoutes = require('./routes/api/notificationsApiRoutes');

app.use('/login', loginRoutes);
app.use('/logout', logoutRoutes);
app.use('/register', registerRoutes);
app.use('/post', middleware.requireLogin, postRoutes);
app.use('/profile', middleware.requireLogin, profileRoutes);
app.use('/uploads', uploadRoutes);
app.use('/search', middleware.requireLogin, searchRoutes);
app.use('/messages', middleware.requireLogin, messagesRoutes);
app.use('/notifications', middleware.requireLogin, notificationsRoutes);

app.use('/api/posts', postsApiRoutes);
app.use('/api/users', usersApiRoutes);
app.use('/api/chats', chatsApiRoutes);
app.use('/api/messages', messagesApiRoutes);
app.use('/api/notifications', notificationsApiRoutes);

app.get('/', middleware.requireLogin, (req, res, next) => {
	const payload = {
		pageTitle: 'Home',
		userLoggedIn: req.session.user,
		userLoggedInJs: JSON.stringify(req.session.user),
	};
	res.status(200).render('home', payload);
});

io.on('connection', (socket) => {
	socket.on('setup', (userData) => {
		socket.join(userData._id);
		socket.emit('connected');
	});
	socket.on('join room', (room) => {
		socket.join(room);
	});
	socket.on('typing', (room) => {
		socket.in(room).emit('typing');
	});
	socket.on('stop typing', (room) => {
		socket.in(room).emit('stop typing');
	});
	socket.on('notification received', (room) => {
		socket.in(room).emit('notification received');
	});
	socket.on('new message', (newMessage) => {
		const { chat } = newMessage;
		if (!chat.users) {
			return console.log('Chat.users not defined');
		}
		chat.users.forEach((user) => {
			if (user._id === newMessage.sender._id) {
				return;
			}
			socket.in(user._id).emit('message received', newMessage);
		});
	});
});
