import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


// Configuration
cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});
 

// Upload an file to Cloudinary
const uploadOnCloudinary = async(localFilePath)=>{
    try{
        if(!localFilePath) return null;
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload
        (localFilePath,{
            resource_type: 'auto'
        });
        //file uploaded successfully
        console.log("File uploaded successfully:",response.url);
        return response;
    }

    catch(error){
        fs.unlinkSync(localFilePath); // Delete the local file after upload attempt as upload of file is failed
        return null;
        console.log(error);
    }
}


export { uploadOnCloudinary };