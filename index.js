const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const {handleMessage}=require('./controllers/Interview')
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" },
});
const db = require("./model/db");
const { startInterview } = require("./controllers/StartInterview");
db();
app.use(cors());
app.use(express.json());
const Conversation=require('./model/Conversation')
const PORT=8000;

io.on("connection",async (socket) => {
  console.log("New client connected:", socket.id);
  
  const token = socket.handshake.auth.token;

  if (!token) {
    console.log("No token provided. Disconnecting...");
    socket.disconnect();
    return;
  }
      try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user.id;
  socket.join(userId);
    console.log(`Socket ${socket.id} joined room ${userId}`);

   
    await Conversation.deleteMany({ userId });
    console.log(`Deleted conversations for user ${userId}`);

  } catch (err) {
    console.log("Invalid token. Disconnecting...");
    socket.disconnect();
    return;
  }

  socket.on("send_message", (data) => {

const token=data.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user.id;
  
    


    handleMessage(io,socket, data);
    console.log(data?.message)
  });
  socket.on("start_interview", (data) => {
    startInterview(socket, data);
    
    console.log(data)
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});
app.get("/",(req,res)=>{
  res.send(`<!DOCTYPE html>
    <html>
      <head>
        <title>Send Message via Socket</title>
        <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
      </head>
      <body>
        <h2>Send a Message to Interview Server</h2>
       
  <textarea
    id="messageInput"
    placeholder="Type your code here"
    style="
      width: 55vw;
      height: 60vh;
      font-size: 18px;
      padding: 10px;
    "
  ></textarea>

  <br />

  <button onclick="sendMessage()">Send</button>

  <pre id="log" style="margin-top: 20px; background: #f0f0f0; padding: 10px;"></pre>

        <script>
          const token = prompt("Enter your JWT token here"); // Simple prompt for now
console.log(token,"tttttt")
          const socket = io("http://localhost:8000", {
            auth: {
              token: token
            }
          });

          socket.on("connect", () => {
            document.getElementById("log").innerText += "\\nConnected with ID: " + socket.id;
          });

          socket.on("disconnect", () => {
            document.getElementById("log").innerText += "\\nDisconnected";
          });

          function sendMessage() {
            const message = document.getElementById("messageInput").value;
            if (message.trim() === "") {
              alert("Please enter a message");
              return;
            }
             socket.emit('send_message', {
        message: message.trim(),token
      });
            document.getElementById("log").innerText += "\\nSent: " + message;
            document.getElementById("messageInput").value = "";
          }

          
          socket.on("receive_message", (data) => {
            document.getElementById("log").innerText += "\\nReceived: " + data.message;
          });
        </script>
      </body>
    </html>`)
})
server.listen(PORT,()=>console.log(`Server is running on ${PORT}`))  