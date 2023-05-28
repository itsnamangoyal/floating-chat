import { events } from "./client";

export function getEventFromMessage(data: any) {
  const message = getMessage(data);
  const eventJSON = JSON.parse(message);

  for (const event of events) {
    try {
      const parsedEvent = event.parse(eventJSON);

      return parsedEvent;
    } catch (error) {
      // do nothing
    }
  }

  throw new Error("Invalid event");
}

function getMessage(data: string | Uint8Array) {
  if (data instanceof Uint8Array) {
    const textdecoder = new TextDecoder();
    const message = textdecoder.decode(data);
    return message;
  }

  return data;
}
