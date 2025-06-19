const jwt=require('jsonwebtoken');
module.exports=(req,res,next)=>{
const token=req.header("Authorization").split(" ")[1];
if(!token) return res.status(401).json({message:"No token,authorization failed"});
try{
const decode=jwt.verify(token,process.env.JWT_SECRET);
req.user=decode.user;
next();

}catch(err){
    res.status(401).json({message:"Invalid token"})
}



};
