import mongoose from "mongoose";
import {ApiError} from "../utlis/ApiError.js"
import {ApiResponse} from "../utlis/ApiResponse.js"
import {asyncHandler} from "../utlis/asyncHandler.js"
import {Subscription} from "../models/subscription.model.js"



const toggleSubscription = asyncHandler( async(req, res)=>{

    //Steps to toggle the subscription 

    //1. Get the channel id from params
    //2. Apply validations 
    //3. If the subscription is already present,delete the subscription 
    //4. If not present already  create a new one 

    //NOTE : Send only response as subscribed true or false and not the data
    

    //1. 
    const {channelId} = req.params 

    //2. 
    if(!channelId){
        throw new ApiError(400, "Channel Id is missing")
    }

    //3. 
    const subscriptionPresent = await Subscription.findOne({
      
        channel : channelId,
        subscriber : req.user?._id     
    })

    if(subscriptionPresent){

        await Subscription.findByIdAndDelete(subscriptionPresent?._id)


        return res
               .status(200)
               .json(
                new ApiResponse(200, {subscribed: false}, "Subscription deleted Successfully")
               )

    }

    //4. 

    const newSubscription = await Subscription.create({

        channel : channelId,
        subscriber : req.user?._id
    })

    if(!newSubscription){
        throw new ApiError(500, "Couldn't Fetch the subscription")
    }

    return res
           .status(200)
           .json(
            new ApiResponse(200, {subscribed : true}, "Subscription Created Successfully")
           )
})


const getUserChannelSubscribers = asyncHandler( async(req, res)=>{

    //Steps to get the list of channels user has subscribed to 

    //1. Get channel ID from params
    //2. Apply Validations
    //3. Get the required details from DB using pipelines 
    //4. Send response

    //1. 
    const {channelId} = req.params

    //2. 
    if(!channelId){
        throw new ApiError(400, "Channel Id is missing")
    }

    //3. 
    const Subscribers = await Subscription.aggregate([
        
        {
            $match : {
                channel : new mongoose.Types.ObjectId(channelId)
            }
        },

        {
           $lookup : {
            from : "users",
            localField : "subscriber",
            foreignField : "_id",
            as : "subscribers",

            pipeline: [
                
                {
                   $project : {
                    fullName :1,
                    username :1, 
                    avatar : 1
                   }
                }
            ]
           }
        },

        {

             $sort : {
                createdAt  : -1
             }
        },

        {
            $addFields : {

                subscriberCount :{
                    $size : "$subscribers"
                }
            },

            subscribers  :{
                $first : "$subscribers"
            }
        },

        {
            $project : {
                subscriberCount :1, 
                subscribers :1
            }
        }
    ])


    if(!Subscribers){
        throw new ApiError(500, "Couldn't fetch the subscriber list")
    }

    return res
           .status(200)
           .json(
            new ApiResponse(200, Subscribers, "Fetched Subscribers Successfully")
           )
    
    
})


const getSubscribedChannels = asyncHandler( async(req, res)=>{


    //Steps to get the list of channels subscribed by the currennt channel

    //1. Get the channel Id from params
    //2. Apply validations
    //3. Get the required data from DB using pipelines
    //4. Send response


    //1. 
    const {subscriberId} = req.params()

    //2. 
    if(!subscriberId){
        throw new ApiError(400, "Subscriber Id is missing")
    }

    //3.
    const channelsSubscribedTo = await Subscription.aggregate([

        {
            $match: {
                subscriber : new mongoose.Types.ObjectId(subscriberId)
            }
        },

        {
           $lookup :{
            from :"users",
            localField : "channel",
            foreignField : "_id",
            as :"ChannelsSubscribed",

            pipeline : [
                {
                    $project : {
                        fullName :1, 
                        avatar :1, 
                    }
                }
            ]
           } 
        },

        {
            $addFields : {

                subscribedCount : {
                    $size : "$ChannelsSubscribed"
                },

                isSubscribed : {
                    $cond : {

                        in: { $in : [req.user?._id, "$ChannelsSubscribed.subscriber"]},

                        then : true, 
                        else : false
                    }
                },

                ChannelsSubscribed : {
                    $first : "$ChannelsSubscribed"
                }
            }
        },

        {
            $project : {

                ChannelsSubscribed : 1,
                isSubscribed :1, 
                subscribedCount :1, 
            }
        }
    ])

    if(!channelsSubscribedTo){
        throw new ApiError(500, "Couldn't Fetch The Channels Subscribed List")
    }

    //4
    return res
           .status(200)
           .json(
            new ApiResponse(200, channelsSubscribedTo, "Subscribed Channels Fetched Successfully")
           )
      
})


export {
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
}