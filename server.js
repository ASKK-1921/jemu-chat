/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

process.on('uncaughtException', (err) => {
	console.log('=x_x= UNCAUGHT EXCEPTION =x_x= : Shutting down server...');
	console.log(err.name, err.message);

	// Shut down server with exit code of 1 for uncaught exception
	process.exit(1);
});

// Set location of environment configuration file
dotenv.config({ path: './config.env' });

// Set location of entry point of the system
const app = require('./app');

// Set credentials for DB connection
const db = () => {
	// Use the development database
	if (process.env.NODE_ENV === 'development') {
		return process.env.DEV_DB.replace('<PASSWORD>', process.env.DEV_DB_PASSWORD);
	}
	// Use the test database
	if (process.env.NODE_ENV === 'test') {
		return process.env.TEST_DB.replace('<PASSWORD>', process.env.TEST_DB_PASSWORD);
	}
	// Use the production database
	return process.env.PROD_DB.replace('<PASSWORD>', process.env.PROD_DB_PASSWORD);
};

// Establish connection to the database
mongoose
	.connect(db(), { useUnifiedTopology: true, useNewUrlParser: true })
	.then(() => console.log('=^_^= DB connection successful =^_^='))
	.catch((error) => console.log(`👹 Database connection failed 👹 ${error.message}`));

// Set listening port
const port = process.env.PORT || 3000;

// Start the server
const server = app.listen(port, () => {
	console.log(`=^_^= Server listening on port ${port} =^_^=`);
	if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
		console.log(` <!> Working in ${process.env.NODE_ENV} mode <!>`);
	}
});

// Attach a socket.io server to the running server
const io = new Server(server, { pingTimeout: 60000 });
// const io = require('socket.io')(server, { pingTimeout: 60000 });

// Safety net to catch unhandled rejections and log details
process.on('unhandledRejection', (err) => {
	console.log('=x_x= UNHANDLED REJECTION =x_x= : Shutting down server...');
	// console.log(err.name, err.message);
	console.log(err.stack);

	// End all processes with server.close before shutting down with exit code of 1
	server.close(() => {
		process.exit(1);
	});
});

// Handle all socket.io events
let onlineUsers = [];

io.on('connection', (socket) => {
	socket.on('setup', (userData) => {
		if (!onlineUsers.some((user) => user.userId === userData)) {
			onlineUsers.push({ userId: userData, socketId: socket.id });
		}
		socket.join(userData);
		socket.emit('connected');
		socket.emit('update online users', onlineUsers);
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
	socket.on('disconnect', () => {
		onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
		socket.emit('update online users', onlineUsers);
	});
	socket.on('offline', () => {
		onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
		socket.emit('update online users', onlineUsers);
	});
});
