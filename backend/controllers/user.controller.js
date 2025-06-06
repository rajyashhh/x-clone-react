import { resolveSoa } from "dns";
import {v2 as cloudinary} from "cloudinary";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js"
import bcrypt from "bcrypt";



const getUserProfile = async (req,res) => {
    const {username} = req.params;
    try {
        const user = await User.findOne({username}).select("-password");
        if(!user){
            return res.status(404).json({
                error : "No user found with this username"
            })
        }
        res.status(200).json(user);
    } catch (error) {
        console.log("Error in getUserProfile: ", error.message),
        res.status(500).json({
            error : error.message
        })
    }
}


const followUnfollowUser = async (req,res) => {
    try {
        const {id} = req.params;
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if(id===req.user._id.toString()){
            return res.status(400).json({
                message : "You can not follow/unfollow yourself!"
            })
        }
        if(!userToModify || !currentUser){
            return res.status(400).json({
                error : "User not found!"
            })
        }

        console.log("Current user:", currentUser._id);
        console.log("User to modify:", userToModify._id);
        console.log("Current followers:", userToModify.followers);

        const isFollowing = currentUser.following.includes(id);
        if(isFollowing){
            //Unfollow the user
            await User.findByIdAndUpdate(id,{
                $pull: {followers : req.user._id}
            });
            await User.findByIdAndUpdate(req.user._id, {
                $pull: {following: id}
            });
            console.log("Unfollowed. New followers:", (await User.findById(id)).followers);
            res.status(200).json({
                message: "User unfollowed successfully"
            })
        }else{
            //Follow the user
            await User.findByIdAndUpdate(id,{ $push: {followers : req.user._id}});
            await User.findByIdAndUpdate(req.user._id, {$push: {following: id}})
            
            //Send notification to the user
            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                to: userToModify._id
            })
            await newNotification.save();
            console.log("Followed. New followers:", (await User.findById(id)).followers);
            res.status(200).json({
                message: "User followed successfully"
            })
        }
    } catch (error) {
        console.log("Error in followUnfollowUser: ", error.message),
        res.status(500).json({
            error : error.message
        })
    }
}


const getSuggestedUser = async(req,res) => {
    try {
        const userId= req.user._id;
        const userFollowedByMe = await User.findById(userId).select("following");
        const users = await User.aggregate([{
            $match: {
                _id: {$ne: userId},
            },
        },
        {
            $sample: {size:10}
        }
    ]);
    const filteredUsers = users.filter((user)=>!userFollowedByMe.following.includes(user._id));
    const suggestedUsers = filteredUsers.slice(0,4);
    suggestedUsers.forEach((user)=> (user.password = null));
    res.status(200).json(suggestedUsers);
    } catch (error) {
        console.log("Error in getSuggestedUsers: ", error.message);
        res.status(500).json({error: error.messsage})
    }
}

const updateUser = async(req,res) => {
    const {fullName, email, username, currentPassword, newPassword, bio, link} = req.body;
    let {profileImg, coverImg} = req.body;
    const userId = req.user._id;
    try {
        let user = await User.findById(userId);
        if(!user){
            return res.status(400).json({
                error : "User not found"
            })
        };
        if(currentPassword && newPassword){
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if(!isMatch){
                return res.status(400).json(
                    {
                        error: "Current password is incorrect"
                    }
                )
            }
            if(newPassword.length<6){
                return res.status(400).json({
                    error : "Password must be atleast 6 characters long"
                })
            }
            user.password = await bcrypt.hash(newPassword,10);
        }
        if(profileImg){
            if(user.profileImg){
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
            }
            const uploadedResponse = await cloudinary.uploader.upload(profileImg);
            profileImg = uploadedResponse.secure_url;
        }
        if(coverImg){
            if(user.coverImg){
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
            }
            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            coverImg = uploadedResponse.secure_url;
        }
        if (username && username !== user.username) {
			const usernameExists = await User.findOne({ username });
			if (usernameExists) {
				return res.status(400).json({ error: "Username already taken" });
			}
			user.username = username;
		}
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        user = await user.save();

        //password should be null in response
        user.password = null;

        return res.status(200).json(user);
    } catch (error) {
        console.log("Error in updateUser:", error.message);
        return res.status(500).json({ error: "Server error" });
    }
}

const getFollowers = async (req, res) => {
  try {
    const { username } = req.params;
    
    // First get the user to find their followers array
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Then find all users whose IDs are in the followers array
    const followers = await User.find({
      _id: { $in: user.followers }
    }).select("-password");

    res.status(200).json(followers);
  } catch (error) {
    console.log("Error in getFollowers controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getFollowing = async (req, res) => {
  try {
    const { username } = req.params;
    
    // First get the user to find their following array
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Then find all users whose IDs are in the following array
    const following = await User.find({
      _id: { $in: user.following }
    }).select("-password");

    res.status(200).json(following);
  } catch (error) {
    console.log("Error in getFollowing controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const searchUsers = async (req, res) => {
    try {
        const q = req.query.q?.trim();
        if (!q) return res.json([]);
    
        const regex = new RegExp(q, "i"); // case-insensitive
    
        const users = await User.find({
            $or: [{ username: regex }, { fullName: regex }],
        }).select("username fullName profileImg");
    
        res.json(users);
    } catch (err) {
        console.error("Error in searchUsers:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const searchMentions = async (req, res) => {
    try {
        const q = req.query.q?.trim();
        if (!q) return res.json([]);
    
        const regex = new RegExp(q, "i"); // case-insensitive
    
        const users = await User.find({
            $or: [{ username: regex }],
        }).select("_id username profileImg"); // Only return necessary fields for mentions
    
        res.json(users);
    } catch (err) {
        console.error("Error in searchMentions:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

export {getUserProfile, followUnfollowUser, getSuggestedUser, updateUser, getFollowers, getFollowing, searchUsers, searchMentions};