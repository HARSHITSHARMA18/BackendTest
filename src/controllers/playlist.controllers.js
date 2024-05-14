import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utlis/ApiError.js"
import {ApiResponse } from "../utlis/ApiResponse.js"
import {asyncHandler} from "../utlis/asyncHandler.js"
import {Playlist} from "../models/playlist.model.js"


const createPlaylist = asyncHandler( async(req, res)=>{

    //Steps to create a playlist

    //1. Get the name and description from body
    //2. Apply validations
    //3. Check if the playlist already exist with same name or description 
    //4. If not, create a new entry in DB
    //5. Apply validations
    //6. Send response


    //1. 
    const {name, description} = req.body

    //2.
    if(!name && !description){
        throw new ApiError(400, "Name and Description to create a playlist is required")
    }

    //3. 
    const existedPlaylist = await Playlist.findOne({
        $or:[{name},{description}]
    })

    if(existedPlaylist){
        throw new ApiError(409, "Playlist already exist with the same name or description")
    }

    //4. 
    const playlist = await Playlist.create({
        name : name,
        description : description
    })

    //5. 
    if(!playlist){
        throw new ApiError(500, "Couldn't create a new playlist")
    }

    //6. 
    return res
           .status(200)
           .json(
            new ApiResponse(200, playlist, "Playlist Created Successfully")
           )

})


const getUserPlaylists = asyncHandler( async(req, res)=>{

    //Steps to get User playlist

    //1. Get the user Id from params
    //2. Apply validations 
    //3. Retreive data from DB using pipelines
    //4. Apply validations 
    //5. Send response

    //1.
    const {userId} = req.params

    //2. 
    if(!userId){
        throw new ApiError(400, "User id is missing")
    }

    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(404, "Invalid User Id")
        }
    }

    //3. 
    const playlists = await Playlist.aggregate([

        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId)
            }
        },

        {
            $lookup: {
                from : "videos",
                localField : "videos",
                foreignField : "_id",
                as : "videos"
            }
        },

        {
            $addFields : {

                videoCount : {
                    $size : "$videos"
                },

                totalView : {
                    $sum :"$videos.views"
                }
            }
        },

        {
            $project : {
               
                name : 1,
                description : 1,
                createdAt : 1, 
                updatedAt : 1, 
                videoCount : 1, 
                totalView : 1
            }
        }
    ])

    //4. 
    if(!playlists){
        throw new ApiError(500, "Couldn't fetch the user playlists")
    }

    //5.
    return res
           .status(200)
           .json(
            new ApiResponse(200, playlists, "Successfully Fetched All The User Playlist")
           )

})


const getPlaylistById = asyncHandler( async(req, res)=>{


    //Steps to get the playlist by id

    //1. Get the playlist id from params
    //2. Apply validations
    //3. Get the required details from DB using pipelines
    //4. Apply validations 
    //5. Send response

    //1. 
    const {playlistId} = req.params

    //2.
    if(!playlistId){
        throw new ApiError(400, "Playlist Id is missing")
    }

    if(playlistId){
        if(!isValidObjectId(playlistId)){
            throw new ApiError(404, "Playlist Id is not valid")
        }
    }

    //3. 
    const playlist = await Playlist.aggregate([

        {
            $match : {
                _id : new mongoose.Types.ObjectId(playlistId)
            }
        },

        {
            $lookup:  {
                from : "videos",
                localField: "videos",
                foreignField:  "_id",
                as : "videoList",

                pipeline: [

                    {
                        $lookup : {
                            from : "users",
                            localField :"owner",
                            foreignField : "_id",
                            as : "owner",

                            pipeline :[
                                {
                                    $project : {
                                        fullName : 1,
                                        username : 1, 
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },

                    {
                        $addFields : {

                        
                            owner : {
                                $first : "$owner"
                            }
                        }
                    },

                    {
                        $project : {
                           
                            VideoFile : 1,
                            thumbnail : 1,
                            title : 1,
                            views : 1, 
                            duration : 1, 
                            createdAt : 1, 
                            owner : 1, 

                        }
                    }
                ]
            }
        },

        {
  
           $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "playlistOwner",

                pipeline: [

                    {
                        $lookup : {
                            from : "subscription",
                            localField : "_id",
                            foreignField : "channel",
                            as : "subscribers"
                        }
                    },

                    {
                        $addFields : {

                            subscriberCount : {
                                $size : "$subscribers"
                            } 
                        }
                    },

                    {
                        $project : {

                            fullName : 1, 
                            username : 1,
                            avatar :  1,
                            subscriberCount : 1
                        }
                    }
                ]
           }           

        },


        {
            $addFields : {

                videoList : { 
                    $first : "$videoList"
                },

                videosCount : {
                 
                    $size: "$videoList"
                },

                playlistOwner : {
                    $first : "$playlistOwner"
                },

                totalView : {
                    $sum :"$videoList.views"
                }
            }
        },

        {
            $project :{ 
                name : 1, 
                description  : 1,
                videoList : 1, 
                videosCount : 1,
                totalView : 1, 
                playlistOwner : 1, 
                createdAt : 1,
 

            }
        }
    ])


    //4. 
    if(!playlist){
        throw new ApiError(500, "Couldn't fetch the video list")
    }

    //5. 
    return res
           .status(200)
           .json(
            new ApiResponse(200, playlist, "Video List Fetched Successfully For Playlist")
           )
         


})


const addVideoToPlaylist = asyncHandler( async(req, res)=>{

    //Steps to add video in playlist

    //1. Get the video id and playlist id from params
    //2. Apply validations 
    //3. Add the video to the set in playlist
    //4. Apply validations
    //5. Send response

    //1. 
    const {videoId, playlistId} =req.params

    //2. 
    if(!videoId && !playlistId){
        throw new ApiError(400, "Video id and Playlist id is missing")
    }

    if(videoId && playlistId){
        if(!isValidObjectId(videoId) && !isValidObjectId(playlistId)){
            throw new ApiError(404, "Invalid video and playlist id")
        }
            
    }

    //3. 
    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,{
        $addToSet : {
            video : videoId
        }
    })

    //4. 
    if(!updatePlaylist){
        throw new ApiError(500, "Couldn't add video to the playlist ")
    }

    //5. 
    return res
           .status(200)
           .json(
            new ApiResponse(200, updatePlaylist, "Successfully Added The Video To The Playlist")
           )

})

const removeVideoFromPlaylist = asyncHandler( async(req, res)=>{

    //Steps to remove a video from playlist

    //1. Get the video id and playlist id from params
    //2. Apply Validations
    //3. Find the playlist and remove the video 
    //4. Apply validations
    //5. Send response


    //1. 
    const {videoId, playlistId} = req.params

    //2. 
    if(!videoId && !playlistId){
        throw new ApiError(400, "Video id and Playlist id is missing")
    }

    if(videoId && playlistId){
        if(!isValidObjectId(videoId) && !isValidObjectId(playlistId)){
            throw new ApiError(404, "Invalid video and playlist id")
        }
            
    }
    

    //3. 
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,

      //remove video from videos array using pull
      {
        $pull :{
            videos : videoId
        }
      }, 

      {
        new : true
      }
    )

    //4.
    if(!updatePlaylist){
        throw new ApiError(500, "Couldn't remove video from playlist")
    }

    //5.
    return res
           .status(200)
           .json(
            new ApiResponse(200, updatePlaylist, "Successfully Removed Video From Playlist")
           )
    

})

const deletePlaylist = asyncHandler( async(req, res)=>{

    //Steps to delete a playlist 

    //1. Get the playlist id from params
    //2. Apply validations 
    //3. Find by id and delete the playlist 
    //4. Apply validations 
    //5. Send response

    //1. 
    const {playlistId} = req.params

    //2
    if(!playlistId){
        throw new ApiError(400, "Playlist Id is missing")
    }

    //3. 
    const playlist = await Playlist.findByIdAndDelete(playlistId)

    //4. 
    if(!playlist){
        throw new ApiError(500, "Couldn't delete the playlist")
    }

    //5.
    return res
           .status(200)
           .json(
            new ApiResponse(200, {}, "Successfully Deleted The Playlist")
           )

})

const updatePlaylist = asyncHandler( async(req, res)=>{

    //Steps to update the playlist

    //1. Get the updated data from body and playlist id from params
    //2. Apply validations 
    //3. Find and update the playlist
    //4. Apply validations
    //5. Send response

    //1.
    const {playlistId} = req.params

    const {name, description} = req.body

    //2. 
    if(!playlistId){
        throw new ApiError(400, "Playlist Id is missing")
    }

    if(!name && !description){
        throw new ApiError(400, "Name and Description are needed for updating the playlist")
    }

    if(playlistId){
        if(!isValidObjectId(playlistId)){
            throw new ApiError(404,"Invalid Playlist Id")
        }
    }

    //3. 
    const updatedPlaylist = await Playlist.findOneAndUpdate(
        playlistId,
        {
            name : name,
            description : description
        }, 
        {
            new : true
        }
    )

    //4. 
    if(!updatePlaylist){
        throw new ApiError(500, "Couldn't Update the Playlist")
    }

    //5. 
    return res
           .status(200)
           .json(
            new ApiResponse(200, updatedPlaylist, "Successfully Updated the Playlist")
           )

})


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}