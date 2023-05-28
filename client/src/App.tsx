import { useEffect, useRef, useState } from "react";

import { getEventFromMessage } from "./utils/events";
import { LeaveEvent, MessageEvent, MoveEvent } from "./utils/events/client";

import { Arrow } from "./assets/icons";

import "./App.scss";

declare global {
  interface Window {
    socket?: WebSocket;
  }
}

function App() {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [data, setData] = useState<
    Record<
      string,
      { leftPercentage: number; topPercentage: number; message?: string }
    >
  >({});

  useEffect(() => {
    const url = new URL(document.URL);
    const socket = new WebSocket(`ws://${url.hostname}:4001`);

    socket.onopen = () => {
      window.socket = socket;
    };

    socket.onclose = () => {
      window.socket = undefined;
    };

    socket.onmessage = (e) => {
      if (typeof e.data !== "string") return;

      const event = getEventFromMessage(e.data);

      switch (event.type) {
        case "init": {
          setData(event.data);
          break;
        }

        case "leave": {
          setData((data) => {
            const _data = Object.assign({}, data);
            delete _data[event.data.uid];
            return _data;
          });

          break;
        }

        case "move": {
          setData((data) => {
            const _data = Object.assign({}, data);

            if (!_data[event.data.uid]) {
              _data[event.data.uid] = {
                leftPercentage: event.data.leftPercentage,
                topPercentage: event.data.topPercentage,
              };
              return _data;
            }

            _data[event.data.uid].leftPercentage = event.data.leftPercentage;
            _data[event.data.uid].topPercentage = event.data.topPercentage;
            return _data;
          });

          break;
        }

        case "message": {
          setData((data) => {
            const _data = Object.assign({}, data);

            _data[event.data.uid].message = event.data.message;
            return _data;
          });
          break;
        }

        default:
          break;
      }
    };

    return () => {
      window.socket = undefined;
      socket.close();
    };
  }, []);

  useEffect(() => {
    const onPointerMove = (ev: PointerEvent) => {
      if (!window.socket) return;

      const { x: cursorX, y: cursorY } = ev;

      const [leftPercentage, topPercentage] = [
        (cursorX / document.body.clientWidth) * 100,
        (cursorY / document.body.clientHeight) * 100,
      ];

      setData((data) => {
        const _data = Object.assign({}, data);

        if (!_data["self"]) {
          _data["self"] = {
            leftPercentage,
            topPercentage,
          };
          return _data;
        }

        _data["self"].leftPercentage = leftPercentage;
        _data["self"].topPercentage = topPercentage;
        return _data;
      });

      const payload: MoveEvent = {
        type: "move",
        data: {
          leftPercentage,
          topPercentage,
        },
      };

      window.socket.send(JSON.stringify(payload));
    };

    const onPointerLeave = () => {
      if (!window.socket) return;

      setData((data) => {
        const _data = Object.assign({}, data);
        delete _data["self"];
        return _data;
      });

      const payload: LeaveEvent = {
        type: "leave",
      };
      window.socket.send(JSON.stringify(payload));
    };

    const stopEvent = (ev: Event) => {
      ev.preventDefault();
    };

    const onKey = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.altKey || ev.metaKey) return;

      switch (ev.key) {
        case "Escape": {
          if (!window.socket) return;

          setData((data) => {
            if (!data["self"]) return data;
            const _data = Object.assign({}, data);
            delete _data["self"].message;
            return _data;
          });

          const payload: MessageEvent = {
            type: "message",
            data: {
              message: undefined,
            },
          };

          window.socket.send(JSON.stringify(payload));
          break;
        }

        default: {
          setData((data) => {
            if (!data["self"]) return data;
            if (data["self"].message) return data;

            const _data = Object.assign({}, data);
            _data["self"].message = "";
            inputRef.current?.focus();

            return _data;
          });

          break;
        }
      }
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);
    document.addEventListener("contextmenu", stopEvent);
    document.addEventListener("pointerdown", stopEvent);
    document.addEventListener("pointerup", stopEvent);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("contextmenu", stopEvent);
      document.removeEventListener("pointerdown", stopEvent);
      document.removeEventListener("pointerup", stopEvent);
    };
  }, []);

  return (
    <div className="App">
      <div
        className="cursor"
        id="self"
        style={{
          left: `${data["self"]?.leftPercentage || 0}%`,
          top: `${data["self"]?.topPercentage || 0}%`,
          display: data["self"] ? "block" : "none",
        }}
      >
        <textarea
          autoFocus
          className="input"
          spellCheck={false}
          data-active={data["self"]?.message !== undefined}
          ref={inputRef}
          value={data["self"]?.message || ""}
          onChange={(ev) => {
            setData((data) => {
              const _data = Object.assign({}, data);
              _data["self"].message = ev.target.value;
              return _data;
            });

            if (!window.socket) return;

            const payload: MessageEvent = {
              type: "message",
              data: {
                message: ev.target.value,
              },
            };

            window.socket.send(JSON.stringify(payload));
          }}
        />
        <Arrow className="arrow" />
      </div>

      {Object.keys(data).map((uid) => {
        if (uid === "self") return null;

        const { leftPercentage, topPercentage, message } = data[uid];

        return (
          <div
            key={uid}
            className="cursor"
            id={uid}
            style={{
              left: `${leftPercentage}%`,
              top: `${topPercentage}%`,
            }}
          >
            <span className="input" data-active={message !== undefined}>
              {message}
            </span>
            <Arrow className="arrow" />
          </div>
        );
      })}
    </div>
  );
}

export default App;
