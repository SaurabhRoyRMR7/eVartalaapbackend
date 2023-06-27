const jwt=require('jsonwebtoken');
const User=require("../models/Users");
const dotenv = require("dotenv").config();
const Authenticate =async (req,res,next)=>{
    try {
        const token=req.cookies.token;
        const verifyToken=jwt.verify(token,process.env.SECRET_KEY);
        const rootUser= await User.findOne({_id:verifyToken._id,"tokens.token": token});
        if(!rootUser){
            throw new Error('User not there');
        }

        req.token=token;
        req.rootUser=rootUser;
        req.userId=rootUser._id;

        next();
    } catch(err){
       res.status(401).send("Unauthorized:Token not provided");
        console.log(err);
    }
}

module.exports=Authenticate;