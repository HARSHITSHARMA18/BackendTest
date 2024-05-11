import mongoose from "mongoose";
import {ApiError} from "../utlis/ApiError.js"
import {ApiResponse} from "../utlis/ApiResponse.js"
import {asyncHandler} from "../utlis/asyncHandler.js"
import {Like} from "../models/like.model.js"


const toggleVideoLike = asyncHandler( async(req, res)=>{

   //Steps to toggle like of a video

   //1. Get the video id from params
   //2. Apply validations 
   //3. If like is present already, delete the like from DB
   //4. If like is not present, create an entry in DB
   //5. Send response


   //1. 
   const {videoId} = req.params

   //2.
   if(!videoId){
    throw new ApiError(400, "Video Id is Missing")
   }

   //3. 
   const videoLikePresent = await Like.findOne({
    video :videoId,
    likedBy: req.user?._id
   })

   
   if(videoLikePresent){

    await Like.findByIdAndDelete(videoLikePresent?._id)

    return res
           .status(200)
           .json(
            new ApiResponse(200, {liked:false},"Successfully Deleted The Like")
           )

   }

   //4. 
   const newVideoLike = await Like.create({


    video : videoId,
    likedBy : req.user?._id,

   })

   if(!newVideoLike){
    throw new ApiError(500, "Couldn't create a new like entry")
   }

   //5.
   return res
          .status(200)
          .json(
            new ApiResponse(200, {liked: true}, "Successfully Liked The Video")
          )
   
})


const toggleCommentLike = asyncHandler( async(req, res)=>{

    //Steps to toggle like of a video

   //1. Get the comment id from params
   //2. Apply validations 
   //3. If like is present already, delete the like from DB
   //4. If like is not present, create an entry in DB
   //5. Send response


   //1. 
   const {commentId} = req.params

   //2.
   if(!commentId){
    throw new ApiError(400, "Comment Id is Missing")
   }

   //3. 
   const commentLikePresent = await Like.findOne({
    comment :commentId,
    likedBy: req.user?._id
   })

   
   if(commentLikePresent){

    await Like.findByIdAndDelete(commentLikePresent?._id)

    return res
           .status(200)
           .json(
            new ApiResponse(200, {liked:false},"Successfully Deleted The Like")
           )

   }

   //4. 
   const newCommentLike = await Like.create({


    comment :commentId,
    likedBy : req.user?._id,

   })

   if(!newCommentLike){
    throw new ApiError(500, "Couldn't create a new like entry")
   }

   //5.
   return res
          .status(200)
          .json(
            new ApiResponse(200, {liked: true}, "Successfully Liked The Comment")
          )

})

const toggleTweetLike = asyncHandler( async(req, res)=>{

    
    //Steps to toggle like of a video

   //1. Get the comment id from params
   //2. Apply validations 
   //3. If like is present already, delete the like from DB
   //4. If like is not present, create an entry in DB
   //5. Send response


   //1. 
   const {tweetId} = req.params

   //2.
   if(!tweetId){
    throw new ApiError(400, "Tweet Id is Missing")
   }

   //3. 
   const tweetLikePresent = await Like.findOne({
    tweet :tweetId,
    likedBy: req.user?._id
   })

   
   if(tweetLikePresent){

    await Like.findByIdAndDelete(tweetLikePresent?._id)

    return res
           .status(200)
           .json(
            new ApiResponse(200, {liked:false},"Successfully Deleted The Like")
           )

   }

   //4. 
   const newTweetLike = await Like.create({


    tweet :tweetId,
    likedBy : req.user?._id,

   })

   if(!newTweetLike){
    throw new ApiError(500, "Couldn't create a new like entry")
   }

   //5.
   return res
          .status(200)
          .json(
            new ApiResponse(200, {liked: true}, "Successfully Liked The Tweet")
          )
    
})

const getLikedVideos = asyncHandler( async(req, res)=>{

    //Steps to get all the liked video of a user

    //1.Get the video list using aggreagtion pipelines 
    //2. Apply validations 
    //3. Send response
    
    
    //1.
    const videos = await Like.aggregate([
        
        {
            $match:{
                likedBy : new mongoose.Types.ObjectId(req.user?._id)
            }
        },

        {
            $lookup :{ 
                from : "videos",
                localField : "video",
                foreignField: "_id",
                as : "videos",

                pipeline :[ 
                    
                    {
                       isPublished :  true
                    },

                    {
                       $lookup : {
                        from : "users",
                        localField : "owner",
                        foreignField: "_id",
                        as : "owner",

                        pipeline : [

                            {
                                $project:  {
                                    fullName : 1, 
                                    username :1, 
                                    avatar : 1
                                }
                            }
                        ],

                       }
                    },

                    {
                        $addFields : {
                            owner : {
                                $first:  "$owner"
                            }
                        }
                    },

                    {
                        $project :  {
                            videoFile : 1, 
                            thumbnail : 1, 
                            duration :1, 
                            title : 1,
                            views : 1,
                            createdAt : 1,
                            onwer  : 1,
                        }
                    }
                ]
            }
        },

        {
          $sort : {
            createdAt : -1
          }
        },

        {
            $addFields : {
                $first : "$videos"
            }
        },

        {
            $project : {
                videos : 1
            }
        }
    ])

    //2.
    if(!videos){
        throw new ApiError(500, "Couldn't Fetch the Videos")
    }

    //3.
    return res
           .status(200)
           .json(
            new ApiResponse(200, videos, "Successfully Fetched the videos")
           )

})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    toggleCommentLike, 
    getLikedVideos
}