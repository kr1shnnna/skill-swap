const express = require("express");
const cors = require("cors");   
const authRoutes=require("./routes/authRoutes");
const userRoutes=require("./routes/userRoutes");
const matchRoutes=require("./routes/matchRoutes");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());


app.use('/api/auth',authRoutes);
app.use('/api/users',userRoutes);
app.use('/api/matches',matchRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "SkillSwap API is running ",
  });
});


const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});