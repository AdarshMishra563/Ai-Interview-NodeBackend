const axios = require("axios");
const Conversation = require("../model/Conversation");
const dotenv = require("dotenv");
const jwt=require('jsonwebtoken');
dotenv.config();
const togetherAPIKey = '801cdab25f95927800850f8d98265c703010a6cf385414629c7f91c2cd5e34e5';
const unwantedPhrases = [
  "Please let me know if there's anything else I can help you with or if you have any question or concern.",
  "I'm here to help.",
  "Please let me know when you are ready with your answer.",
  "Thank you for your cooperation and understanding.",
  "I'm here to make this interaction as smooth and easy as possible for you."
];
const handleMessage = async (io,socket, data) => {
  const { message, token } = data;
 console.log(message)
 if (!token) {
    socket.emit("error", { error: "No token, authorization failed" });
    return;
  }

  const decode=jwt.verify(token,process.env.JWT_SECRET);
  const userId=decode.user.id;
  

  console.log(userId)
  
 
  

  if (!userId || !message) {
    return socket.emit("error", { error: "userId and message are required" });
  }

  let conversation = await Conversation.findOne({ userId });
  if (!conversation) {
    conversation = new Conversation({
      userId,
      messages: [{ role: "system", content: "You are a helpful AI assistant. Only respond concisely to the user's query. Do not add any polite phrases, introductory or closing remarks like 'I'm here to help', 'Please let me know if', 'Thank you for your cooperation', or similar. Focus strictly on the factual answer." }],
    });
  }

  conversation.messages.push({ role: "user", content: message +" (do not include note in assistant reply)"})


  const maxMessages = 15;
  const systemMessage = {
  role: conversation.messages[0].role,
  content: conversation.messages[0].content
};
  const lastmessages=   conversation.messages.slice(2).slice(-maxMessages).map(m => ({
  role: m.role,

  content: m.content
}));
  const messagesToSend =[systemMessage,...lastmessages]

console.log(messagesToSend)

  try {
    const response = await axios.post(
      "https://api.together.xyz/v1/chat/completions",
      {
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        messages: messagesToSend,
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${togetherAPIKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiReply = response.data.choices[0].message.content;
    conversation.messages.push({ role: "assistant", content: aiReply });
    await conversation.save();
console.log(aiReply)
    
    io.to(userId).emit("ai_reply", { response: aiReply });
io.to(userId).emit("receive_message", { message:aiReply });
  } catch (error) {
    console.error("AI Error:", error.response ? error.response.data : error.message);
    socket.emit("error", { error: "AI error occurred" });
  }
};

module.exports = { handleMessage };
