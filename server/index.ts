import { randomUUID } from "crypto";

import {
  InitEvent,
  LeaveEvent,
  MoveEvent,
  MessageEvent,
} from "./utils/events/server";
import { getEventFromMessage } from "./utils/events";

const data: Record<
  string,
  { leftPercentage: number; topPercentage: number; message?: string }
> = {};

interface WebSocketData {
  uid: string;
}

const server = Bun.serve<WebSocketData>({
  port: 4001,
  fetch(req, server) {
    // upgrade the request to a WebSocket
    if (
      server.upgrade<WebSocketData>(req, {
        data: {
          uid: randomUUID(),
        },
      })
    ) {
      return; // do not return a Response
    }
    return new Response("Upgrade failed :(", { status: 500 });
  },
  websocket: {
    message(ws, message) {
      console.log(message);
      const event = getEventFromMessage(message);

      switch (event.type) {
        case "move": {
          const payload: MoveEvent = {
            type: "move",
            data: {
              uid: ws.data.uid,
              leftPercentage: event.data.leftPercentage,
              topPercentage: event.data.topPercentage,
            },
          };

          ws.publish("room", JSON.stringify(payload));

          if (data[ws.data.uid]) {
            data[ws.data.uid].leftPercentage = event.data.leftPercentage;
            data[ws.data.uid].topPercentage = event.data.topPercentage;

            return;
          }

          data[ws.data.uid] = event.data;
          break;
        }

        case "leave": {
          const payload: LeaveEvent = {
            type: "leave",
            data: {
              uid: ws.data.uid,
            },
          };

          ws.publish("room", JSON.stringify(payload));

          delete data[ws.data.uid];

          break;
        }

        case "message": {
          if (!data[ws.data.uid]) return;

          const payload: MessageEvent = {
            type: "message",
            data: {
              uid: ws.data.uid,
              message: event.data.message,
            },
          };

          ws.publish("room", JSON.stringify(payload));

          data[ws.data.uid].message = event.data.message;
          break;
        }

        default:
          break;
      }
    },
    open(ws) {
      const payload: InitEvent = {
        type: "init",
        data: data,
      };

      ws.send(JSON.stringify(payload));

      ws.subscribe("room");
    },

    close(ws) {
      const payload: LeaveEvent = {
        type: "leave",
        data: {
          uid: ws.data.uid,
        },
      };

      console.log(server.publish("room", JSON.stringify(payload)));

      delete data[ws.data.uid];
    },
  },
  error(request) {
    console.error(request);
  },
  development: true,
});

console.log(`server is running on ${server.hostname}:${server.port}`);
