const WebSocket = require('ws');
const EventEmitter = require('events');

module.exports = function (port) {
	const wss = new WebSocket.Server({port: port});

	let numClients = 0;
	let serverEvents = new EventEmitter();

	wss.on('connection', (ws, req) => {

		let clientID = numClients++;
		ws.isAlive = true;

		let res = {
			json(obj) {
				try {
					ws.send(JSON.stringify(obj));
				} catch (err) {
					//console.log(err);
				}
			}
		};

		serverEvents.emit('connected', {connection: req, id: clientID}, res);

		ws.on('message', (data) => {

			if (data === '<3') {
				ws.isAlive = true;
				return
			}

			let parsedData;
			try {
				parsedData = JSON.parse(data);
			} catch (err) {
				res.json({error: "Invalid JSON"});
				return;
			}

			let req = {
				data: parsedData.data,
				id: clientID
			};

			if (typeof(parsedData.command) === 'string') {
				serverEvents.emit(parsedData.command, req, res);
			} else {
				serverEvents.emit('error', new Error("No 'command' field supplied."), res);
			}
		});

		ws.on('error', (err) => {
			console.error(err);
			serverEvents.emit('error', new Error("Server Error"), res);
		});

		ws.on('close', () => {
			console.log("Client Disconnected")
			serverEvents.emit('disconnected', {id: clientID}, res);
		});

		ws.on('disconnect', () => {
			console.log("Client disconnected (disconnected for real)")

		});

		ws.on('pong', () => {
			this.isAlive = true;
		})
	});

	const interval = setInterval(function ping() {
		wss.clients.forEach(function each(ws) {
			if (ws.isAlive === false) {
				return ws.close();
			}
			ws.isAlive = false;
			ws.send("<3");
		});
	}, 5000);

	return serverEvents;
};
