import mongoose from "mongoose";
import { asyncHandler } from "../utlis/asyncHandler.js";
import { ApiError } from "../utlis/ApiError.js";
import { ApiResponse } from "../utlis/ApiResponse.js";
import {Video} from "../models/video.model.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utlis/cloudinary.js";
import { User } from "../models/user.model.js";
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"

 
const getAllVideos = asyncHandler(async(req,res)=>{

})


const publishAVideo = asyncHandler(async(req, res)=>{

    // Steps to publish a video

    //1. Get the user details from body
    //2. Apply validatons for title and description 
    //3. Check for repetition of title or description
    //4. Get th local path for video and thumbnail
    //5. Apply validations for video and thumbnail
    //6. Upload on cloudinary
    //7. Create new object in collection 
    //8. Validate the creation in db 
    //9. Send response


    //1. 
    const {title, description} = req.body

    //2. 
    if(!title && !description){
        throw new ApiError(400, "Title and Description are required")
    }

    //3.
    const existedVideo = await Video.findOne({

        $or: [{title},{description}]

    })

    if(existedVideo){
        throw new ApiError(409," Video with same Title or Description already exists")
    }

    //4. 
    const videoFileLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    //5.
    if(!videoFileLocalPath){
        throw new ApiError(400, "Video File is required")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required")
    }

    //6.
    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    //7.
    if(!videoFile.url){
        throw new ApiError(400, "Video File is required :: Error while uploading on cloudinary")
    }
    if(!thumbnail.url){
        throw new ApiError(400, "Thumbnail is required:: Error while uploading on cloudinary")
    }


    //8.
    const video = await Video.create({

        title,
        description,
        videoFile : videoFile?.url || "",
        thumbnail : thumbnail?.url || "",
        isPublished : true,
        duration : videoFile?.duration || 0,
        owner : req.user?._id
    })

    //9.
    return res
           .status(200)
           .json(
            new ApiResponse(200, video, "Video is uploaded successfully")
           )

})

const getVideoById = asyncHandler(async(req, res)=>{

    // Steps to get a video by id 

    //1. Get the videoId from params
    //2. Apply Validation 
    //3. Get video details from DB using pipelines
    //4. Apply validation on the output
    //5. Increase the view count and add video to user watch history
    //6. Send reponse


    //1.
    const {videoId} = req.params

    //2.
    if(!videoId){
        throw new ApiError(400, "VideoId is missing")
    }

    //3.
    const video = await Video.aggregate([
        
        // filter the video id
        {
            $match :{
                _id : new mongoose.Types.ObjectId(videoId)
            }
        },

        //add likes from likes schema 
        {
            $lookup :{
                from :"likes",
                localField:"_id",
                foreignField:"video",
                as : "likes",
            }
        },

        //add comments 
        {
            $lookup :{
                from :"comments",
                localField:"_id",
                foreignField : "video",
                as: "comments",

            }
        },

        //add owner -> username, avatar, subscibers , isSubscribed , isLiked
        {
            $lookup :{
                from : "users",
                localField :"owner",
                foreignField :"_id",
                as : "onwer",
                pipeline :[

                    
                        // user with subscription schema
                    { 
                        
                        $lookup: {

                            from : "subscriptions",
                            localField:"_id",
                            foreignField:"channel",
                            as: "subscribers"

                        },
                    },

                    //add fields to onwner
                    {
                        $addFields :{
                            
                            subscriberCount :{
                                $size : "$subscribers"
                            },

                            isSubscribed :{

                                $cond :{

                                    $if :{ $in : [req.user?._id, "$subscribers.subscriber"]},
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },

                    //send required fields only
                    {
                        $project :{
                        username : 1,
                        avatar : 1,
                        subscriberCount:1,
                        isSubscribed:1
                        
                    }
                    }

                        

                    
                ]
            }
        },
 
        //add fields such as likesCount
        {

            $addFields:{

                likesCount :{
                    $size : "$likes"
                },

                owner :{
                    $first : "$owner"
                },

                comments : {
                  
                  $first : "$comments"  

                },

                isLiked :{

                    $cond :{

                        if : { $in : [req.user?._id, "$likes.likedBy" ]},
                        then : true,
                        else:  false
                    }
                }

            }

        },

        //only pass required fields 
        {
            $projects :{

                title : 1, 
                description :1,
                videoFile :1, 
                thumbnail:1,
                owner :1,
                likesCount:1,
                isLiked:1,
                duration :1,
                views:1,
                isPublished:1,
                comments:1


            }
        }



    ])



    
    //4
    if(!video){
        throw new ApiError(401, "Invalid Video Id")
    }

    //5.
    await Video.findByIdAndUpdate(videoId, {
        $inc : {
            views : 1
        }
    })

    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet : {
            watchHistory : videoId
        }
    })

    //6
    return res
           .status(200)
           .json(
            new ApiResponse(200, video[0], "Video Fetched Successfully")
           )

})

const updateVideo = asyncHandler( async(req, res)=>{

    //Steps to update : title, description and thumbnail

    //1. Get the video id from params and updated fields from body
    //2. Apply validations 
    //3. Upload thumbnail on cloudinary and apply validation
    //4. If file uploaded successfully to cloudinry ,remove older one
    //5. find and update the data
    //6. Send response

    //1. 
    const {videoId} = req.params
    
    const {title,description} = req.body

    //2.
    if(!videoId){
        throw new ApiError(400, "Video Id is missing")
    }

    if(!title && !description){
        throw new ApiError(400, "Title and description are required")
    }

    const thumbnailLocalPath = req.file?.path

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required")
    }

    //TODO : Check if the owner of the video is same as the user , if yes then only allow to proceed further

    //3.
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail.url){
        throw new ApiError(400, "Thumbnail is required :: Error while uploading on cloudinary")
    }

 
    //4. TODO : Remove Previous Thumbnail file ( for that add public_id to thumbnail object while)
    // const previousVideo = await Video.findById(videoId)

    // if(!previousVideo){

    //     throw new ApiError(400, "Video Id is invalid")
    // }

    // const previousVideoFile = previousVideo.videoFile.public_id 


    // if(previousVideoFile){
    //     throw new ApiError(400, "Couldn't Get the Public id of Previous Thumbnail")
        
    // }

    // await deleteFromCloudinary(previousVideoFile)


    
    //5.
    const video = await Video.findByIdAndUpdate(
        videoId,

        {
            $set : {
                title ,
                description,
                thumbnail: thumbnail.url
            }
        },

        {
            new : true
        }
    )


    //5.
    return res
           .status(200)
           .json(
            new ApiResponse(200, video, "Video Updated Successfully")
           )
})

const deleteVideo = asyncHandler( async(req,res)=>{

    // Steps To Delete a Video

    //1. Get the video id from params
    //2. Apply Validations 
    //3. Find the video and detail it from DB
    //4. Delete documents from likes and comments collection of the current video
    //4. Send response 

    //1.
    const {videoId} = req.params

    //2.
    if(!videoId){
        throw new ApiError(400, "Video Id Is Missing")
    }

    //TODO : Find if the video owner is the user itself , if yes then proceed
    
    //3.
    const videoToDelete = await Video.findByIdAndDelete(videoId)

    if(!videoToDelete){
        throw new ApiError(400,"Failed to delete video from DB")
    }
    

    //TODO: Remove likes and comments from Like and Comment Model


    //4. 
    await Like.deleteMany({
        
        //condition
        video : videoId,
    })

    await Comment.deleteMany({
        video:videoId,
    })

    //5.
    return res
           .status(200)
           .json(
            new ApiResponse(200,{},"Video Deleted Successfully")
           )

})


const togglePublishStatus = asyncHandler( async (req,res)=>{

    // Steps to toggle visibility

    //1. Get the video id from params 
    //2. Apply Validations 
    //3. Find and update the video visibility
    //4. Send response 

    //1. 
    const {videoId} = req.params

    //2. 
    if(!videoId){
        throw new ApiError(400, "Video Id Is Missing")
    }

    // TODO : Check if the video owner is the user trying to update , if yes then only proceed

    //3. 
    const existedVideo = await Video.findById(videoId)

    if(!existedVideo){
        throw new ApiError(401, "Video Not Found")
    }

    let status = existedVideo?.isPublished 
    status = !status

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            isPublished: status
        },
        {
            new: true
        }
    )


    if(!video){
        throw new ApiError(400, " Couldn't Find the Video in DB")
    }

    //4.

    return res
           .status(200)
           .json(
            new ApiResponse(200, video, "Toggle Published Updated Successfully")
           )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}


