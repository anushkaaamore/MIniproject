import { useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export function useSocket(events) {
  useEffect(() => {
    Object.entries(events).forEach(([name, handler]) => socket.on(name, handler));
    return () => {
      Object.entries(events).forEach(([name, handler]) => socket.off(name, handler));
    };
  }, [events]);
}
