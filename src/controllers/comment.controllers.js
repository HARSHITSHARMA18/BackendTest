import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import { ApiError } from "../utlis/ApiError.js"
import { ApiResponse } from "../utlis/ApiResponse.js"
import { asyncHandler } from "../utlis/asyncHandler.js"
import {Like} from "../models/like.model.js"




const getAllComments = asyncHandler( async(req,res)=>{

    // Steps to get all comments for a specific video

    //1. Get the video id from params and query 
    //2. Apply validation on video id
    //3. Get the required details using pipelines
    //4. Apply validation 
    //5. Send response

    //1. 
    const {videoId} = req.params

    const {page=1, limit=10} = req.query

    //2.
    if(!videoId){
        throw new ApiError("Video Id is missing")
    }

   
    const aggregatedComments = await Comment.aggregate([

        {
            $match :{
                video : new mongoose.Types.ObjectId(videoId)
            }
        },

        {

            $lookup: {
                from :"users",
                localField :"owner",
                foreignField:"_id",
                as : "owner",

                // pipeline:[
                //     {
                //         $project:{
                //             username :1,
                //             fullName :1,
                //             avatar :1 
                //         }
                //     }
                // ]
            }

        },

        {

          $lookup:{
            from : "likes",
            localField :"_id",
            foreignField: "comment",
            as : "likes",
          }

        },

        {
            $addFields : {

                likesCount : {
                    $size : "$likes"
                },

                isLiked : {
                    $cond :{

                        if : { $in : [req.user?._id, "$likes.likedBy"]},
                        then : true, 
                        else: false
                    }
                },

                owner : {
                    $first : "$owner"
                }
            }
        },

        {

            $sort : {
                createdAt : -1
            }
        },

        {
            $project : {
                content : 1,
                createdAt : 1,
                owner :{
                    username : 1,
                    fullName:1, 
                    avatar : 1,
                },
                likesCount :1, 
                isLiked : 1, 


            }
        }
    ])




    if(!aggregatedComments){
        throw new ApiError(500, "Couldn't fetch the Comments ")
    }

    const options = {
        page : parseInt(page, 10),
        limit : parseInt(limit,10)
    }

    const comments = await Comment.aggregatePaginate(aggregatedComments, options)

    //4.
    if(!comments){
        throw new ApiError(500, "Couldn't get the comments after pagination query")
    }

    //5.
    
    return res
           .status(200)
           .json(
            new ApiResponse(200, comments, "Fetched All Comments Successfully")
           )



})


const addComment = asyncHandler( async(req, res)=>{

    // Steps to add comment 

    //1. Get the video id from params and content from body 
    //2. Apply validations 
    //3. Add the entry in DB  
    //4. Apply Validations
    //5. Send response


    //1. 
    const {videoId} = req.params

    const {content} = req.body

    //2. 
    if(!videoId){
        throw new ApiError(400, "Video Id is required")
    }

    if(!content){
        throw new ApiError(400, "Content is required for comment")
    }

    //Extra check
    if(videoId){
        if(!isValidObjectId(videoId)){
            throw new ApiError(404, "Invalid Video Id")
        }
    }

    //3.
    const comment = await Comment.create({

        content : content,
        video : videoId,
        owner : req.user?._id
    })

    //4.
    if(!comment){
        throw new ApiError(500,"Couldn't create an entry in DB")
    }

    //5.
    return res
           .status(200)
           .json(
            new ApiResponse(200, comment, "Comment Added Successfully")
           )
})


const updateComment = asyncHandler( async(req,res)=>{

    //Steps to update comment 

    //1. Get the content from body and comment id from params
    //2. Apply validation 
    //3. Find the comment and update the content 
    //4. Send response

    //1. 
    const {commentId} = req.params

    const {content} = req.body

    //2. 
    if(!commentId){
       throw new ApiError(400, "Comment Id is missing")
    }

    if(!content){
        throw new ApiError(400, "Changed content is required")
    }

    //TODO: Apply restiction so that only owner can update the comment

    //3. 
    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {
            new:true
        }
    )

    if(!comment){
        throw new ApiError(500, "Couldn't get the comment from DB")
    }

    //4. 
    return res
           .status(200)
           .json(
            new ApiResponse(200, comment, "Updated Comment Successfully")
           )


})


const deleteComment = asyncHandler( async(req, res)=>{

    //Steps to delete a comment

    //1. Get the comment id from params
    //2. Apply validation 
    //3. Find and delete the entry from DB, apply validation
    //4. Delete the occurences of comment in the Like Schema
    //5. Send response


    //1.
    const {commentId} = req.params

    //2. 
    if(!commentId){
        throw new ApiError(400, "Commment Id is missing")
    }

    //3. 
    const existedComment = await Comment.findByIdAndDelete(commentId)

    if(!existedComment){
        throw new ApiError(500, "Couldn't fetch and delete the comment ")
    }

    //4. 
    await Like.deleteMany({
        comment:commentId,

        //optional
        likedBy : req.user?._id
    })

})

export {
    getAllComments,
    addComment,
    updateComment,
    deleteComment
}