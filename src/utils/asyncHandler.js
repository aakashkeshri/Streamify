const asyncHandler = (requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((error)=>next(error));
    }
}

export {asyncHandler};


/*
this used mostly to handle and call db multiple times without writting thus again and again and use this fn directly

const asyncHandler = (fn)=>async(req,res,next)=>{  
    try {
        await fn(req,res,next);
    }

    catch(error){
        res.status(error.code || 500).json({
            success:false,
            message:error.message ||"Internal Server Error"
        })
    }
}

*/
