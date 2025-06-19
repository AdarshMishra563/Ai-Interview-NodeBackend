const axios = require("axios");
const Conversation = require("../model/Conversation");
const dotenv = require("dotenv");
const jwt=require('jsonwebtoken');
dotenv.config();
const togetherAPIKey = '801cdab25f95927800850f8d98265c703010a6cf385414629c7f91c2cd5e34e5';


const startInterview = async (socket, data) => {
  const { topic, level, name, token } = data;

  if (!token) return socket.emit("error", { error: "Unauthorized" });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.user.id;

  let conversation = await Conversation.findOne({ userId });
  const systemPrompt = `You are an experienced technical interviewer conducting a live job interview for ${name}. The topic is "${topic}" at "${level}" difficulty. Start by asking one question based on the topic meant with level and correctness and focus on coding round and theoretical too and if code is wrong ask for explain the code. do not include () other than questions, leave this out and if user say i dont know or something like that provide answer for privious question by saying ok and keep explanations very short and understanding else proceed to next question" . Focus strictly on interview questions, wait for user replies after each. Do not answer questions yourself. Be concise. Fetch and reference past conversation links when helpful. Point out technical mistakes, weaknesses, and grammar errors. Replace "that’s a good explanation" with "ok ok". Only compliment truly accurate answers. One question at a time. Never speak on behalf of the candidate. and when user say explain privious question then ask which one give details .Exclude When you submit your code, I will review it and point out any mistakes or weaknesses. If your code is incorrect, I will ask you to explain it and correct any errors. `

  if (!conversation) {
    conversation = new Conversation({ userId,messages : [{
    role: "system",
    content: systemPrompt
  }]
 });
  }

  conversation.interviewMode = true;
  conversation.interviewTopic = topic;
  conversation.interviewLevel = level;
  conversation.userName = name;

 
  
 
  await conversation.save();

  
  try {
    const response = await axios.post(
      "https://api.together.xyz/v1/chat/completions",
      {
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      messages: [
  { role: "system", content: systemPrompt },
  { role: "user", content: `Please start the interview now.Start with a short greeting to ${name}, with asking about myself and every details like education and marks and college if its not included in my answer ` }
],
        temperature: 0.7,
        max_tokens: 500,
        stop: ["\n"]
      },
      {
        headers: {
          Authorization: `Bearer ${togetherAPIKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiQuestion = response.data.choices[0].message.content;

    conversation.messages.push({ role: "assistant", content: aiQuestion });
    await conversation.save();

    socket.emit("ai_reply", { response: aiQuestion });

  } catch (error) {
    console.error("Interview AI Error:", error.response ? error.response.data : error.message);
    socket.emit("error", { error: "Interview AI error occurred" });
  }
};
module.exports={startInterview}
