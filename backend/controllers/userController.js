const User=require("../models/User");
const Swap = require("../models/Swap");

const cloudinary = require("../config/cloudinary");
const multer = require("multer");


const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});



const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image.",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "skillswap/profile-pictures",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      uploadStream.end(req.file.buffer);
    });

    user.profilePicture = uploadResult.secure_url;

    await user.save();

    res.status(200).json({
      message: "Profile picture updated successfully.",
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);

    res.status(500).json({
      message: "Failed to upload profile picture.",
    });
  }
};




const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      user,
    });

  } catch (error) {
    console.error("Get profile error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const updateProfile=async (req,res)=>{
    try{

        const { name, bio, gender,skillsToTeach, skillsToLearn } = req.body;

        const user=await User.findById(req.user.userId);

        if(!user){
            return res.status(404).json({
                message:"User not found"
            })
        }

            // Update only fields that were provided
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (gender !== undefined) user.gender = gender;
    if (skillsToTeach !== undefined) user.skillsToTeach = skillsToTeach;
    if (skillsToLearn !== undefined) user.skillsToLearn = skillsToLearn;

    const updatedUser = await user.save();
    res.status(200).json({
        message: "Profile updated successfully",
        user: {
            id:updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            bio: updatedUser.bio,
            gender: updatedUser.gender,
            profilePicture: updatedUser.profilePicture,
            skillsToTeach: updatedUser.skillsToTeach,
            skillsToLearn: updatedUser.skillsToLearn,
        }
        });
    }
    catch(error){

        console.error('Profile update error:', error.message);

        res.status(500).json({
            message: 'Server error',
        })

    }
}

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const swap = await Swap.findOne({
      $or: [
        {
          sender: req.user.userId,
          receiver: req.params.userId,
        },
        {
          sender: req.params.userId,
          receiver: req.user.userId,
        },
      ],
    }).sort({ updatedAt: -1 });

    let relationshipStatus = "available";

    if (swap) {
      if (swap.status === "accepted") {
        relationshipStatus = "connected";
      } else if (
        swap.status === "pending" &&
        swap.sender.toString() === req.user.userId.toString()
      ) {
        relationshipStatus = "request_sent";
      } else if (
        swap.status === "pending" &&
        swap.receiver.toString() === req.user.userId.toString()
      ) {
        relationshipStatus = "request_received";
      }
    }

    res.status(200).json({
      user,
      relationshipStatus,
    });
  } catch (error) {
    console.error("Get user by ID error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};


module.exports={
    getProfile,
    updateProfile,
  getUserById,
  uploadProfilePicture,
  upload,
}