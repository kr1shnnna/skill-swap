const express= require("express");


const { getMatches } = require("../controllers/matchController");
const protect  = require("../middlewares/authMiddleware");


const router=express.Router();

router.get("/", protect, getMatches);



module.exports=router;