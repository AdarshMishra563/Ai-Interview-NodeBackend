const mongoose = require("mongoose");


const messageSchema = new mongoose.Schema({
  role: String,
  content: String
});

const conversationSchema = new mongoose.Schema({
  interviewMode: { type: Boolean, default: false },
interviewTopic: { type: String },
interviewLevel: { type: String },
userName: { type: String },

  userId: {type: mongoose.Schema.Types.ObjectId, ref:'Taskmanagementusers'},
  messages: [messageSchema]
});

module.exports = mongoose.model("Conversation", conversationSchema);
