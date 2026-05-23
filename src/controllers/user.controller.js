import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js';
import {User} from '../models/user.model.js';
import{uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken=async(userId)=>{
    try{
        const user= await User.findById(userId)
        const accessToken= user.generateAccessToken();
        const refreshToken= user.generateRefreshToken();

        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});

        return {accessToken, refreshToken};
    }

    catch(error){
        throw new ApiError(500, "Failed to generate tokens");
    }
}


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


const loginUser= asyncHandler(async(req,res)=>{

    //req->body->data
    //username or email
    //find user
    //password check
    //generate access token and refresh token
    //save cookike
    //send response with access token and refresh token

    const{username,email,password}=req.body;

    if((!username && !email) || !password){
        throw new ApiError(400, "Username or email and password are required");
    }

    const user = await User.findOne({
        $or:[{email}, {username}]
    })

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const passwordMatch = await user.isPasswordCorrect(password);

    if(!passwordMatch){
        throw new ApiError(401, "Invalid user credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken");

    const options={
        httpOnly:true,
        secure:true
    }
    
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    );

})

const logoutUser= asyncHandler(async(req,res)=>{
    
    const user= await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{refreshToken:""}
        },
        // old method{new:true},
        {returnDocument:"after"} // new method to return updated document

    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            null,
            "User logged out successfully"
        )
    );  

    
})


const refreshAccessToken= asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken 

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request, refresh token is missing");
    }

    try{
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if(!user){
            throw new ApiError(401, "Invalid refresh token, user not found");
        }

        if(user?.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "Refresh token is expired or invalid");
        }

        const options={
            httpOnly:true,
            secure:true
        }

        const {accessToken, newrefreshToken} = await generateAccessAndRefreshToken(user._id);

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    newrefreshToken
                },
                "Access token refreshed successfully"
            )
        );
        
    }

    catch(error){
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
};