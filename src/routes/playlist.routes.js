import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controllers";


const router = Router()

router.use(verifyJWT)


router.route("/").post(createPlaylist)

router.route("/:playlistId").get(getPlaylistById)


router.route("/:playlistId").patch(updatePlaylist)


router.route("/:playlistId").delete(deletePlaylist)


router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)


router.route("/add/:videoId/:playlistId").patch(removeVideoFromPlaylist)


router.route("/user/:userId").get(getUserPlaylists)




