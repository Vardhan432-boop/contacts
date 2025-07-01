const mongoose=require('mongoose');
const userSchema=mongoose.Schema({
    username:String,
    email:String,
    password:String,
    contacts:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"contact"
    }]
})
module.exports=mongoose.model("user",userSchema);