const express=require('express');
const app=express();
const mongoose=require('mongoose');
const path = require('path');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const cookieParser = require('cookie-parser'); // Added cookie-parser
require('dotenv').config();
const secret=process.env.SECRET_KEY;
const PORT=process.env.PORT;
const userModel=require('./models/usermodel');
const contactModel=require('./models/contactmodel');
const { body, validationResult }=require('express-validator');
mongoose.connect(process.env.MONGO_URL);
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));
app.use(cookieParser()); // Use cookie-parser
app.set("view engine","ejs");
app.get("/",function(req,res){
    res.render("create")
})
app.post("/create",[
    body('username','enter valid username').exists().isLength({min:3}),
    body('email','email is compulsory','enter a valid email').exists().isEmail(),
    body('password','password must be atleast 6 charcacters').isLength({min:6}),
],function(req,res){
    let errors=validationResult(req);
    if(!errors.isEmpty()) {
        return res.render("create",{errors:errors.array()});
    }
    let {username,email,password}=req.body;
    bcrypt.genSalt(10,function(err,salt){
        bcrypt.hash(password,salt,async function(err,hash){
            await userModel.create({
                username,
                email,
                password:hash,
            });
            res.redirect("/login"); // Move redirect here after user is created
        })
    })
})
app.get("/login",function(req,res){
    res.render("login");
})
app.post("/login",async function(req,res){
    let user=await userModel.findOne({email:req.body.email});
    if(!user) return res.status(404).send("User doesn't exist");
    bcrypt.compare(req.body.password,user.password,function(err,result){
        if(result){
            let token1=jwt.sign({email:user.email},secret);
            res.cookie("token1",token1)
            res.redirect(`/home/${user._id}`);
        }
        else{
            res.status(401).send('Invalid credentials'); // Use 401 and user-friendly message
        }
    })
})
app.get("/home/:id",isLogged,async function(req,res){
    const user=await userModel.findOne({email:req.email}).populate({
        path:"contacts",
        options:{sort:{name:1}}
    })
    res.render("home",{user});
})
function isLogged(req,res,next) {
    if(!req.cookies.token1) return res.redirect("/login"); // Fix cookie check and path
    else {
        try {
            let data=jwt.verify(req.cookies.token1,secret);
            req.email=data.email;
            next();
        } catch (err) {
            return res.redirect("/login");
        }
    }
}
app.get("/createcontact",isLogged,async function(req,res){
    const user=await userModel.findOne({email:req.email});
    res.render("createcontact",{user});
})
app.post("/createcontact",isLogged,[
    body('name','enter a valid name').isLength({min:3}),
    body('mobilenumber','enter a valid mobile number').isMobilePhone(),
],async function(req,res){
    const errors=validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).render("createcontact",{errors:errors.array()})
    }
    const user=await userModel.findOne({email:req.email});
    const contact=await contactModel.create({
        name:req.body.name,
        mobilenumber:req.body.mobilenumber,
        userid:user._id,
    });
    user.contacts.push(contact._id);
    await user.save();
    res.redirect(`/home/${user._id}`);
})
app.get("/editcontact/:id",isLogged,async function(req,res){
    const user=await userModel.findOne({email:req.email});
    const contact=await contactModel.findOne({_id:req.params.id});
    res.render("editcontact",{contact});
})
app.post("/editcontact/:id",isLogged,async function(req,res){
    const user=await userModel.findOne({email:req.email});
    const contact=await contactModel.findOneAndUpdate({_id:req.params.id},{name:req.body.name,mobilenumber:req.body.mobilenumber});
    res.redirect(`/home/${user._id}`);
})
app.get("/deletecontact/:id",isLogged,async function(req,res){
    const user=await userModel.findOne({email:req.email});
    const contact=await contactModel.findOneAndDelete({_id:req.params.id});
    user.contacts.pull(contact._id);
    await user.save();
    res.redirect(`/home/${user._id}`);
})
app.get("/logout",isLogged,function(req,res){
    res.cookie("token1","");
    res.redirect("/login");
})
app.listen(PORT);

