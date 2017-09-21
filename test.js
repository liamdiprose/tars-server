const Websocket = require('ws');

const WS_URL = "ws://localhost:3001";
const NUM_CLIENTS = 4;

let sockets = [];


let avaibleComupters = []

let xs = ["0.0", "1.1", "2.1", "3.2"];
let ys = ["0.0", "1.0", "2.1", "3.1", "4.2", "5.2", "6.3", "7.3", "8.4"];

for (let x of xs) {
        for (let y of ys) {
                avaibleComupters.push(x + " " + y)
        }
}


function getRandomDesk () {
        let ind = Math.floor( Math.random() * avaibleComupters.length );

        let desk = avaibleComupters[ind];
        avaibleComupters.splice(ind, 1);
        return desk;
}

function returnDesk (deskName) {
        avaibleComupters.push(deskName);
}

for (let i = 0; i < NUM_CLIENTS; i++) {

        let ws = new Websocket(WS_URL);

        let computer = getRandomDesk();
        ws.on('open', () => {
                console.log(`${computer} is joining the queue...`);
                ws.send(JSON.stringify({command: "join-queue", data: { computer: computer }}));
        });

        ws.on('message', (message) => {
            if (message === '<3') {
                ws.send('<3');
                return
            }
            message = JSON.parse(message);

            if (message.status === "removed") {
                    returnDesk(computer);
                    let comupter = null
                    setTimeout(() => {
                            computer = getRandomDesk();
                            console.log(`${computer} is joining the queue...`);
                            try {
                                ws.send(JSON.stringify({command: "join-queue", data: { computer: computer }}));
                            } catch (e) {
                                // do nothing
                            }
                    }, Math.floor((Math.random()*40)+5) * 1000);
            }
        });

        ws.on('close', () => {
                console.log(`[${computer}] connection closed`);
        });
}

