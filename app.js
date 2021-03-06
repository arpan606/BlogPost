const express=require("express");
const bodyparser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const app=express();
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");


app.use(bodyparser.urlencoded({extended:true}));
app.set("view engine",'ejs');
app.use(express.static("public"));

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.use(session({
  secret: "secret key",
  resave: false,
  saveUninitialized:false,
}));

app.use(passport.initialize());
app.use(passport.session());
////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////mongoDB///////////////////////////////////////////////////////////


mongoose.connect("mongodb://localhost:27017/blogdataDB");

const userSchema=new mongoose.Schema({
  userid:String,
  passid:String
});

userSchema.plugin(passportLocalMongoose);

const blogSchema=new mongoose.Schema({
  blog_title:String,
  blog_content:String,
  blog_id:String
});

const User=mongoose.model("User",userSchema);
const BlogData=mongoose.model("BlogData",blogSchema);


passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {

  User.findById(id, function(err, user) {
    done(err, user);
  });
});


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////home route ////////////////////////////////////////////////////////////////////////////////////////////
app.get("/",function(req,res){
   res.render("main");
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////about ////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/about",function(req,res){
res.render("about");
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////login//////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/login",function(req,res){
  res.render("login");
});

app.post("/login",async function(req,res){
const user=new User({
  userid:req.body.username,
  passid:req.body.password
});

try{

  await req.login(user,function(err){
  if(err)
  {
    console.log(err);
    res.send("email or password is wrong!!");
  }else{
     passport.authenticate("local")(req,res,function(){
      res.redirect("/blog/"+req.body.username);
    });
  }


  });

}catch(err){

  console.log(err);
}


});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////blog////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/blog/:emailid",function(req,res){

  if(req.isAuthenticated()){
       res.render("blog",{emailid:req.params.emailid});
  }else{
    res.redirect("/login");
  }

});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////compose////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/compose/:emailid",function(req,res){

  if(req.isAuthenticated()){
       res.render("compose",{emailid:req.params.emailid});
  }else{
    res.redirect("/login");
  }
});

app.post("/compose/:emailid",async function(req,res){

const blogtitle=req.body.blogtitle;
const blogcontent=req.body.blogcontent;

const newblog=new BlogData({
  blog_content:blogcontent,
  blog_title:blogtitle,
  blog_id:req.params.emailid
});


try{
  await newblog.save();
  res.redirect("/blogpage/"+req.params.emailid);
}catch(err){
  console.log(err);
  res.send("please fill valid information");
}

});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////sign up////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/signup",function(req,res){
  res.render("signup");
});


app.post("/signup",async function(req,res){

const idmail=req.body.username;

try{
await User.register({username:idmail},req.body.password,function(err,user){

if(err)
{
  console.log(err);

  res.send("account already exit");
}else{

  passport.authenticate("local")(req,res,function(){
    res.redirect("/blog/"+req.body.username);
  });
}
});

}catch(err)
{
  console.log(err);
}

});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////SINGLE POST ////////////////////////////////////////////////////////////////////////////////////////////


app.get("/singlepost/:postname",async function(req,res){
  var check=req.params.postname;

try{

 await BlogData.findOne({blog_title:check},function(err,data){
    if(err)
      {
        res.send("no tile found !!");
        console.log(err);
      }
      else{
     res.render("singlepost",{data:data});
   }
  });

}catch(err){
  console.log(err);
}

});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////LOGUT/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/logout",function(req,res){
req.logout();
res.redirect("/");
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////show all blogs (BLOGPAGE)///////////////////////////////////////////////////////////////////////////////////////////////

app.get("/blogpage/:emailid",async function(req,res){
  if(req.isAuthenticated()){

    try{
      await BlogData.find({},function(err,bloginfo){
      if(err)
        {console.log(arr);}
       res.render("blogpage",{bloginfo:bloginfo,emailid:req.params.emailid});
    });

  }catch(err){
    console.log(err);
  }

  }else{
    res.redirect("/");
  }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////MY POST (user)////////////////////////////////////////////////////////////////////////////////////////////////////


app.get("/mypost/:emailid",async function(req,res){

  if(req.isAuthenticated()){

    try{
      await BlogData.find({blog_id:req.params.emailid},function(err,data){
      if(err)
        {
          console.log(arr);
        }else
        {
        res.render("mypost",{bloginfo:data,emailid:req.params.emailid})
        }
    });
  }catch(err){
    console.log(err);
  }

  }else{
    res.redirect("/");
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////DELETE ////////////////////////////////////////////////////////////////////////////////////

app.get("/delete/:emailid",function(req,res){
  res.render("delete",{emailid:req.params.emailid});
});

app.post("/delete/:emailid",async function(req,res)
{
  const title_name=req.body.title_name;

  try{

  await BlogData.findOneAndRemove({blog_id:req.params.emailid,blog_title:title_name},function(err,user){

  if(err)
  {
    console.log(err);
  }else
  {
    console.log("removed!!!!");
    res.redirect("/mypost/"+req.params.emailid);
  }

  });

}catch{

  console.log(err);
}

});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////UPDATE/////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/update/:emailid",function(req,res){
res.render("update",{emailid:req.params.emailid});
});


app.post("/update/:emailid",async function(req,res){

try{
  await BlogData.findOneAndUpdate({blog_title:req.body.title_name},{$set:{blog_title:req.body.new_name}},{new:true},function(err,data){

  if(err)
  {
    console.log(err);
   res.send("please enter valid title");
  }

    res.redirect("/blog/"+req.params.emailid);

  });
}catch(err)
{
  console.log(err);
}

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.listen(function(){
  console.log("server started");
});
