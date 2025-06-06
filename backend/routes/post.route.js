import express from "express";
import protectedRoute from "../middlewares/protectedRoute.js";
import { createPost, deletePost, commentOnPost, likeUnlikePost, getAllPosts, getLikedPosts, getFollowingPost, getUserPosts } from "../controllers/post.controller.js";

const router = express.Router();

router.get("/all",protectedRoute,getAllPosts);
router.get("/likes/:id", protectedRoute, getLikedPosts)
router.get("/following", protectedRoute, getFollowingPost)
router.get("/user/:username", protectedRoute, getUserPosts);
router.post("/create",protectedRoute,createPost);
router.post("/like/:id", protectedRoute, likeUnlikePost);
router.post("/comment/:id", protectedRoute, commentOnPost);
router.delete("/:id",protectedRoute,deletePost);

export default router;