//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//const encrypt = require("mongoose-encryption");
//const md5 = require("md5");
//const bcrypt = require("bcrypt");
//const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

//VERY IMPORTANT TO PLACE THIS CODE RIGHT HERE!!!!
app.use(session({
    secret: "Our secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secrets: [{secret: String}]
});

userSchema.plugin(passportLocalMongoose);

//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.listen(3000, function(){
    console.log("Server runing on port 3000.");
});

app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){

        User.find({"secrets": {$ne: null}}, function(err, foundSecrets){
            if(err){
                console.log(err);
            }
            else{
                if(foundSecrets){
                    res.render("secrets", {userSecrets: foundSecrets});
                }
            }
        });
    }
    else{
        res.redirect("/login");
    }
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.render("/login");
    }
});

app.post("/submit", function(req, res){

    const submitedSecret = {secret: req.body.secret};

    User.findOneAndUpdate({_id: req.user.id}, {$push: {secrets: submitedSecret}}, function(err){
        if(err){
            console.log(err);
        }
        else{
            /*if(foundUser){
                foundUser.secret = submitedSecret;

                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }*/
            res.redirect("/secrets");
        }
    });
});

app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
    /*bcrypt.hash(req.body.password, saltRounds, function(err, hash){

        const newUser = new User({
            email: req.body.username,
            password: hash
        });
    
        newUser.save(function(saveErr){
            if(!err){
                res.render("secrets");
            }
            else{
                console.log(saveErr);
            }
        });
    });*/
});

app.post("/login", function(req, res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });

    /*const logUsername = req.body.username;
    const logPassword = req.body.password;

    User.findOne({email: logUsername}, function(findErr, foundUser){
        if(!findErr){
            if(foundUser){
                bcrypt.compare(logPassword, foundUser.password, function(err, result){
                    if(result === true){
                        res.render("secrets");
                    }
                });
            }
        }
        else{
            console.log("Log error");
        }
    });*/
});

