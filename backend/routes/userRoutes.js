const express=require('express');

const {
    getProfile,
    updateProfile,
    getUserById,
    upload,
    uploadProfilePicture,
    removeProfilePicture,

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

router.delete(
  "/profile/picture",
  protect,
  removeProfilePicture
);


module.exports=router;