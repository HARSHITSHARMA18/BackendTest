import { Router } from "express";
import { addComment, deleteComment, getAllComments, updateComment } from "../controllers/comment.controllers.js";
import {verifyJWT} from "../middlewares/auth.middleware.js" 

const router = Router()

router.use(verifyJWT)

router.route("/:videoId").get(getAllComments)

router.route("/:videoId").post(addComment)

router.route("/c/:commentId").patch(updateComment)

router.route("/c/:commentId").delete(deleteComment)

export default router