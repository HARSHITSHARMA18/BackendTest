import { Router } from "express";

import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllVideos, getVideoById, publishAVideo, updateVideo } from "../controllers/video.controllers.js";


const router = Router()

// router.route("/").get(getAllVideos)
router.use(verifyJWT)

router.route("/").post(
    upload.fields([
        {
         name :"videoFile",
         maxCount :1
        },
        {
           name: "thumbnail",
           maxCount:1 
        }
    ]),
    publishAVideo
)

router.route("/:videoId").get(getVideoById)

router.route("/:videoId").patch(upload.single("thumbnail"), updateVideo)



export default router