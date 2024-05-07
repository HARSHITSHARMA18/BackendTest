import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controllers.js";


const router = Router()

router.use(verifyJWT)

router.route("/").post(createTweet)

router.route("/user/:userId").get(getUserTweets)

router.route("/:tweetId").patch(updateTweet)

router.route("/:tweetId").delete(deleteTweet)


export default router

