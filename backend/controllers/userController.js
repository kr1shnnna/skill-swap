const User=require("../models/User");



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

        const { name, bio, skillsToTeach, skillsToLearn } = req.body;

        const user=await User.findById(req.user.userId);

        if(!user){
            return res.status(404).json({
                message:"User not found"
            })
        }

            // Update only fields that were provided
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
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
    const user = await User.findById(req.params.userId).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      user,
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
  getUserById
}