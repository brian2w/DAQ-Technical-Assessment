import net from 'net';
import { WebSocket, WebSocketServer } from 'ws';
import { appendFileSync } from 'fs';

const TCP_PORT = parseInt(process.env.TCP_PORT || '12000', 10);

const tcpServer = net.createServer();
const websocketServer = new WebSocketServer({ port: 8080 });

// mapping timestamp to number of times exceeded
interface timeExceedMapI {
    [key: string]: number;
}
const timeExceedMap: timeExceedMapI = {};

tcpServer.on('connection', (socket) => {
    console.log('TCP client connected');

    socket.on('data', (msg) => {
        console.log(msg.toString());

        // HINT: what happens if the JSON in the received message is formatted incorrectly?
        // HINT: see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
        try {
            let currJSON = JSON.parse(msg.toString());
            if (
                currJSON.battery_temperature < 20 ||
                currJSON.battery_temperature > 80
            ) {
                if (!(currJSON.timestamp in timeExceedMap)) {
                    timeExceedMap[currJSON.timestamp] = 0;
                }
                timeExceedMap[currJSON.timestamp] += 1;

                // remove stale timestamps
                for (const currTimeStamp in timeExceedMap) {
                    const currTimeStampNum = parseInt(currTimeStamp);
                    if (currTimeStampNum < currJSON.timestamp - 5000) {
                        delete timeExceedMap[currTimeStamp];
                    }
                }

                console.log('timeExceedMap', timeExceedMap);

                if (
                    Object.values(timeExceedMap)
                        .filter((value) => typeof value === 'number')
                        .reduce((sum, value) => sum + value, 0) > 3
                ) {
                    appendFileSync(
                        './incidents.log',
                        currJSON.timestamp + '\n'
                    );
                }
            }
        } catch (err) {
            console.error(err);
        }

        websocketServer.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg.toString());
            }
        });
    });

    socket.on('end', () => {
        console.log('Closing connection with the TCP client');
    });

    socket.on('error', (err) => {
        console.log('TCP client error: ', err);
    });
});

websocketServer.on('listening', () => console.log('Websocket server started'));

websocketServer.on('connection', async (ws: WebSocket) => {
    console.log('Frontend websocket client connected to websocket server');
    ws.on('error', console.error);
});

tcpServer.listen(TCP_PORT, () => {
    console.log(`TCP server listening on port ${TCP_PORT}`);
});
