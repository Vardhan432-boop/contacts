const mongoose=require('mongoose');
const contactSchema=mongoose.Schema({
    name:String,
    mobilenumber:Number,
    userid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    profilepic:String,
})
module.exports=mongoose.model("contact",contactSchema);