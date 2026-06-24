import { io } from "socket.io-client";

const socket = io(
  "https://syncx-backend-a5pj.onrender.com"
);

export default socket;