const mongoose=require("mongoose");

const swapSchema=new mongoose.Schema({

    sender:{
        type:mongoose.Schema.Types.ObjectId, 
        ref:"User",
        required:true
    },
    receiver:{
        type:mongoose.Schema.Types.ObjectId, 
        ref:"User",
        required:true
    },
    status:{
        type:String,
        enum:["pending","accepted","rejected"],
        default:"pending"
    },
},

    {
        timestamps:true
    }

);

    const Swap=mongoose.model("Swap",swapSchema);
    module.exports=Swap;

  