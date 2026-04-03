import jwt from 'jsonwebtoken';
import "dotenv/config";
import user from '../models/user.js';

export const protectRoute =async(req,res,next)=>{
    try{
        let token =req.cookie.jwt;
        if(!token){
            const authHeader=req.headers.authorization;
            if(authHeader&& authHeader.startsWith("Bearer ")){
                token=authHeader.substring(7);
            }
        }
        if(!token ){
            return res.status(401).json({message:"Unathorized - no token provided"});
        }

        const decoded =jwt.verify(token,process.env.JWT_SECRET)

        if(!decoded)
            return res.status(401).json({message:"Unauthorized - Invalid token"});

        const User =await user.findById(decoded.userId).select('-password');

        if(!User) 
            return res.status(404).json({message:"User not defined"});

        req.user=user;

    }catch(err){
        console.log("Error in protect Route middleware  :",err);
        res.status(500).json({message:"Internal server error"});
    }
};
