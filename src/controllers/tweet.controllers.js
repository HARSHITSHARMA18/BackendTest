import mongoose from "mongoose";
import {asyncHandler} from "../utlis/asyncHandler.js"
import {ApiError} from "../utlis/ApiError.js" 
import {ApiResponse} from "../utlis/ApiResponse.js"
import {Tweet} from "../models/tweet.model.js"
import {Like} from "../models/like.model.js"



const createTweet = asyncHandler( async(req, res)=>{


    //Steps to create a tweet

    //1. Get content from body
    //2. Apply Validations
    //3. Create an entry in DB 
    //4. Send response 


    //1. 
    const {content} = req.body

    //2. 
    if(!content){
        throw new ApiError(400, "Content is required for a tweet")
    }

    //3. 
    const tweet = await Tweet.create({

        content : content,
        owner : req.user?._id
    })

    if(!tweet){
        throw new ApiError(500, "Couldn't create a tweet ")
    }

    //4. 
    return res
           .status(200)
           .json(
            new ApiResponse(200, tweet, "Tweet Created Successfully")
           )

})


const getUserTweets = asyncHandler( async(req, res)=>{


  // Steps to get users tweet 

  //1. Get the user id from the params 
  //2. Apply Validations 
  //3. Get the required data using pipelines -> (fullName, avatar), (content, createdAt), (likesCount, isLiked)
  //4. Apply Validations 
  //5. Send response 

  //TODO : Use pagination for tweets

  //1. 
  const {userId} = req.params

  //2. 
  if(!userId){
    throw new ApiError(400, "User Id is missing")
  }

  //3. 
  const tweets = await Tweet.aggregate([
    {
        $match :{
            owner : new mongoose.Types.ObjectId(userId)
        }
    },

    {
        $lookup : {

            from :  "users",
            localField : "owner",
            foreignField :"_id",
            as : "owner",

            pipeline : [

                {
                    $project : {
                    username : 1,
                    fullName : 1,
                    avatar : 1
                }
            }

            ]
        }
    },

    {
        $lookup : {
            
            from : "likes",
            localField : "_id",
            foreignField : "tweet",
            as : "likes"
        }
    },

    {
      $addFields : {

        likesCount  : {
          $size : "$likes"
        },

        isLiked : {

            $cond : {

                if : { $in : [req.user?._id, "$likes.likedBy" ]},

                then : true,

                else : false

            }
        },

        owner : {
            $first :  "$owner"
        }

      }
    },

    {
        $sort : {
            createdAt : -1
        }
    },

    {
        $project :  {

            content : 1, 
            createdAt : 1, 
            owner : 1, 
            likesCount : 1,
            isLiked : 1
        }
    }


  ])


  //4. 
  if(!tweets){
    throw new ApiError(500, "Couldn't Fetch the Tweets")
  }

  //5. 
  return res
         .status(200)
         .json(
            new ApiResponse(200, tweets, "User Tweets Fetched Successfully")
         )
      


})

const updateTweet = asyncHandler( async(req, res)=>{

    //Steps to update the tweet

    //1. Get the content from the body and tweetId from the params
    //2. Apply Validations
    //3. Find and update the tweet
    //4. Send response


    //1. 
    const {tweetId} = req.params

    const {content} = req.body

    //2. 
    if(!tweetId){
        throw new ApiError(400, "Tweet Id is missing")
    }

    if(!content){
        throw new ApiError(400, "Content is needed for the tweet to update")
    }

    //TODO : Check if tweets owner is req.user._id 

    //3.
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId, 
        {
            content: content
        },
        {
            new: true
        }
    )

    if(!updatedTweet){
        throw new ApiError(500, "Couldn't Update the tweet")
    }

    //4. 
    return res
           .status(200)
           .json(
            new ApiResponse(200, updatedTweet, "Tweet Updated Successfully")
           )

})

const deleteTweet = asyncHandler( async(req, res)=>{

    //Steps to delete the tweet

    //1. Get the tweet id from params
    //2. Apply validations
    //3. Find and delete the tweet
    //4. Delete all occurences of that tweet from Like Schema
    //5. Send response


    //1. 
    const {tweetId} = req.params

    //2.
    if(!tweetId){
        throw new ApiError(400, "Tweet Id is missing")
    }

    //3.
    const tweet = await Tweet.findByIdAndDelete(tweetId)

    if(!tweet){
        throw new ApiError(500, "Couldn't Delete the Tweet")
    }

    //4.
    await Like.deleteMany({
        tweet : tweetId,
    })

    //5. 
    return res
           .status(200)
           .json(
            new ApiResponse(200, {}, "Tweet Deleted Successfully")
           )
})



export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}