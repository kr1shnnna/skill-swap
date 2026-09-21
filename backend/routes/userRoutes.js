const express=require('express');

const {
    getProfile,
    updateProfile,
    getUserById,
    upload,
    uploadProfilePicture

}=require('../controllers/userController');
const protect=require('../middlewares/authMiddleware');
const router=express.Router();


router.get("/profile", protect, getProfile);
router.put('/profile',protect,updateProfile);

router.get("/:userId", protect, getUserById);

router.post(
  "/profile/picture",
  protect,
  upload.single("profilePicture"),
  uploadProfilePicture,
);


module.exports=router;