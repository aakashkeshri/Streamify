import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';
import {User} from '../models/user.model.js';
import{uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser=asyncHandler(async(req,res)=>{
    /*
    first made like this for testing
    res.status(200).json({
        message:"Ok-registerUser"
    })
    */

    //get user details from req.body
    // but we are using multer for file upload so we will get details from req.body and files from req.files
    //validation-not empty 
    //check if user already exists:username and email should be unique
    //check for coverimg and avatar
    //upload to cloudinary, avatar is mandatory but coverimg is optional
    //create user obj- create entry in db
    //remove password and refresh token from response
    //check if user created successfully or not and send response accordingly

    const{username,email,fullname,password}=req.body;
    // console.log("email:",email);
    //console.log("req.body:",req.body);
    //console.log("req.files:",req.files);

    if(fullname==="" || username==="" || email==="" || password===""){
        throw new ApiError(400, "All fields are required");
    }
    
    const existedUser= await User.findOne({
        $or:[{email}, {username}]
    });

    if(existedUser){
        throw new ApiError(409, "User with this email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverimageLocalPath = req.files?.coverimage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverimage = await uploadOnCloudinary(coverimageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user= await User.create({
        username:username.toLowerCase(),
        email,
        fullname,
        password,
        avatar:avatar.url,
        coverimage:coverimage?.url||""
    })

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Failed to register user");
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser,"User registered successfully")
    );

})

export {registerUser};