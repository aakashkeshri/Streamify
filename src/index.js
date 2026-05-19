// require("dotenv").config({path: "./.env"});
/* this above line is all correct and run without any error but it uses req statement and other uses import st.
*/

import dotenv from "dotenv";
dotenv.config({ 
    path: "./.env" 
});
// to use import we also changed dev statement in package.json

import connectDB from "./db/index.js";
connectDB()



/*
1st method to connect to DB and start server
but it is not good as it make index file heavy

import mongoose from "mongoose";
import { DB_NAME } from "./constants.js"
import express from "express";
const app = express();

;(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on("error", (error) => {
            console.error("Error starting the server:", error)
        })

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`)
        }) 
    }

    catch (error) {
        console.error("Error connecting to MongoDB:", error)
        throw error
    }
})();
*/