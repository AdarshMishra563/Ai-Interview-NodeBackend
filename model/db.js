const mongoose =require('mongoose');
const dotenv = require("dotenv");
dotenv.config();

const db=async ()=>{
try{
await mongoose.connect(process.env.MONGO_URI);
console.log("connected to database");

}catch(err){console.log(err);
    process.exit(1);
}
};
module.exports =db;