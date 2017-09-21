const EventEmitter = require('events');
const URL = require('url');
const fs = require('fs');

const createServer = require('./server');

const info = new EventEmitter();  // TODO: Change this variable name

const queue = [];
const userData = {};

// TODO: Seperate module for loading/validation
const layout = JSON.parse(fs.readFileSync("./lab1.json", "utf-8"));

const server = createServer(3001);


server.on('connected', (req, res) => {
	// console.log(`New connection from ${req.connection.remoteAddress}`);

	// Add to info stream if endpoint is '/info'

	info.emit('new-connection', {});
	userData[req.id] = {
		callbacks: []
	};

	let endpoint = URL.parse(req.connection.url).path;
	if (endpoint === '/info') {
		server.emit('info', {body: {}}, res);
	}
});

server.on('join-queue', (req, res) => {
	console.log(`User ${req.id} wants to join a queue`);

	if (queue.includes(req.id)) {
		res.json({error: "You are already in the queue."});
		console.log(`id ${req.id} is already in queue ${queue}`);
		return;
	}

	let userPosition = queue.length;

	queue.push(req.id);
	res.json({status: 'new-position', data: { pos: userPosition }});

	function userChangesCallback (user) {
		if (user.computer === userData[req.id].computer) {
			res.json({status: "removed", data: {reason: user.removedBy}});


		} else {
			let userPosition = queue.indexOf(req.id);
			if (user.pos <= userPosition) {
				res.json({status: "new-position", data: { pos: userPosition}});
			}
		}
	}

	info.on('user-left', userChangesCallback);

	userData[req.id].callbacks.push(() => { info.removeListener('user-left', userChangesCallback)});

	let timeOfArrival = new Date().toISOString();
	info.emit('user-joined', {computer: req.data.computer, joined: timeOfArrival});

	userData[req.id].joined = timeOfArrival;
	userData[req.id].computer = req.data.computer;

});

server.on('leave-queue', (req, res) => {
	console.log(`User ${req.id} wants to leave the queue`);

	let userPosition = queue.indexOf(req.id);
	queue.splice(userPosition, 1);

	// TODO: Get computer by userID

	info.emit('user-left', {pos: userPosition, removedBy: 'self'});
});

server.on('dismiss-user', (req, res) => {
	console.log(`User ${req.id} wants to remove user ${req.data.computer} from the queue`);

	// TODO: JWT authentication

	let userID = Object.keys(userData).find(uid => userData[uid].computer === req.data.computer);

	let userPosition = queue.indexOf(userID);
	queue.splice(userPosition, 1);
	info.emit('user-left', {computer: req.data.computer, pos: userPosition, removedBy: 'admin'});
});

server.on('disconnected', (req, res) => {

	let userPosition = queue.indexOf(req.id);
	if (userPosition >= 0) {
		queue.splice(userPosition, 1);
		info.emit('user-left', {computer: userData[req.id].computer, pos: userPosition, reason: 'disconnected'})
	}
	info.emit('user-disconnected', {removedBy: 'user disconnected'});

	for (let removeCallback of userData[req.id].callbacks) {
		removeCallback()
	}
});

server.on('error', (err, res) => {
	console.error(err);

	if (res) {
		res.json({error: err.message || "An Error Occurred"})
	}
});

server.on('info', (req, res) => {
	// TODO unsubscribe

	server.emit('get-queue', req, res);

	let channelsToSubscribe = req.body.channels || ['user-joined', 'user-left'];

	for (let channel of channelsToSubscribe) {
		info.on(channel, (data) => {
			res.json({info: channel, data: data})
		});
	}
});

server.on('get-queue', (req, res) => {
	res.json({
		info: 'queue',
		data: {
			queue: queue.map(id => userData[id])  // TODO: Map queue -> { computername, username, joined, etc...}
		}
	});
});

server.on('get-layout', (req, res) => {
	res.json({info: "layout", data: {layout: layout}});
});

let loggedChannels = ['user-left', 'user-joined', 'new-connection', 'user-disconnected'];
for (let channel of loggedChannels) {
	info.on(channel, (data) => {
		console.log({info: channel, data: data});
	});
}
