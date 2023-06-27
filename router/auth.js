const express = require("express");
const router=express.Router();
const User = require("../models/Users");
const Post = require("../models/Post");
const ChatModel = require("../models/ChatModel");
const MessageModel = require("../models/MessageModel");
const bcrypt = require("bcryptjs");
const Users = require("../models/Users");
const jwt =require('jsonwebtoken');
const authenticate=require("../middleware/authenticate");
const multer = require("multer");

//REGISTER
router.post("/register", async (req, res) => {
// console.log(req.body);
// res.json({message: req.body});
try {
  //generate new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);
  const salts = await bcrypt.genSalt(10);
  const hashedConfirmPassword = await bcrypt.hash(req.body.confirmPassword, salts);

  //const userExist = await User.findOne({ email: req.body.email });

  // if(userExist){
  //   return res.status(422).json("email already exist");
  // }
  // else if(req.body.password!=req.body.confirmPassword)
  // {
  //   return res.status(422).json("passwords are not matching");
  // }
  //create new user
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
    confirmPassword: hashedConfirmPassword,
  });

  //save user and respond
  const user = await newUser.save();
  res.status(200).json(user);
} catch (err) {
  res.status(500).json(err)
}

});

//LOGIN
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    !user && res.status(404).json("user not found");

    const token= await user.generateAuthToken();
    console.log(token);
    res.cookie("token",token,{
      expires:new Date(Date.now()+25892000000),
      httpOnly:false,
      sameSite:"none",
      secure:false,
    });
    

    const validPassword = await bcrypt.compare(req.body.password, user.password)
    !validPassword && res.status(400).json("Invalid Credentials")

    res.status(200).json(user)

    //res.status(200).json(user)
  } catch (err) {
    res.status(500).json(err)
  }
});

//Chatting equal to conversation
router.post("/chatmodel",async (req, res) => {
//res.send("kya yaaar 2");
  const newChatModel = new ChatModel({
    members:[req.body.senderId,req.body.receiverId],
  });

  try {
    const savedChatModel= await newChatModel.save();
    res.status(200).json(savedChatModel)
  } catch (err) {
    res.status(500).json(err)
  }
});



//Chat model users Messaging

router.get("/chatmodel/:userId", async (req, res) => {
  
 
    try {
      const chatmodel= await ChatModel.find({
        members:{$in: [req.params.userId]},
      })
      res.status(200).json(chatmodel)
    } catch (err) {
      res.status(500).json(err)
    }
  });

  router.get("/chatmodel/find/:firstUserId/:secondUserId", async (req, res) => {
    try {
      const chatmodel = await ChatModel.findOne({
        members: { $all: [req.params.firstUserId, req.params.secondUserId] },
      });
      res.status(200).json(chatmodel)
    } catch (err) {
      res.status(500).json(err);
    }
  });

  //Messaging 
router.post("/messagemodel", async (req, res) => {
  //res.send("kya yaaar 2");
    const newMessageModel = new MessageModel({
      chatId: req.body.chatId,
      senderId: req.body.senderId,
      text: req.body.text,
    });
  
    try {
      const savedMessageModel= await newMessageModel.save();
      res.status(200).json(savedMessageModel)
    } catch (err) {
      res.status(500).json(err)
    }
  });

  router.get("/messagemodel/:chatId", async (req, res) => {
    try {
      const messages = await MessageModel.find({
        chatId: req.params.chatId,
      });
      res.status(200).json(messages);
    } catch (err) {
      res.status(500).json(err);
    }
  });
  

  // //get a user

  // router.get("/users", async (req, res) => {
  //   const userId = req.query.userId;
  //   const username = req.query.username;
  //   try {
  //     const user = userId
  //       ? await User.findById(userId)
  //       : await User.findOne({ username: username });
  //     const { password, updatedAt, ...other } = user._doc;
  //     res.status(200).json(other);
  //   } catch (err) {
  //     res.status(500).json(err);
  //   }
  // });

  router.post("/posts", async (req, res) => {
    const newPost = new Post(req.body);
    try {
      const savedPost = await newPost.save();
      res.status(200).json(savedPost);
    } catch (err) {
      res.status(500).json(err);
    }
  });
  //update a post
  
  router.put("/posts/:id", async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (post.userId === req.body.userId) {
        await post.updateOne({ $set: req.body });
        res.status(200).json("the post has been updated");
      } else {
        res.status(403).json("you can update only your post");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  });
  //delete a post
  
  router.delete("/posts/:id", async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (post.userId === req.body.userId) {
        await post.deleteOne();
        res.status(200).json("the post has been deleted");
      } else {
        res.status(403).json("you can delete only your post");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  });
  //like / dislike a post
  
  router.put("/posts/:id/like", async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post.likes.includes(req.body.userId)) {
        await post.updateOne({ $push: { likes: req.body.userId } });
        res.status(200).json("The post has been liked");
      } else {
        await post.updateOne({ $pull: { likes: req.body.userId } });
        res.status(200).json("The post has been disliked");
      }
    } catch (err) {
      res.status(500).json(err);
    }
  });
  //get a post

  router.get("/posts/:id", async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      res.status(200).json(post);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  router.get("/allposts", async (req, res) => {
    try {
      const post = await Post.find({});
      res.status(200).json(post);
    } catch (err) {
      res.status(500).json(err);
    }
  });
  
  //get timeline posts
  
  router.get("/posts/timeline/:userId", async (req, res) => {
    try {
      const currentUser = await User.findById(req.params.userId);
      const userPosts = await Post.find({ userId: currentUser._id });
      const friendPosts = await Promise.all(
        currentUser.followings.map((friendId) => {
          return Post.find({ userId: friendId });
        })
      );
      res.status(200).json(userPosts.concat(...friendPosts));
    } catch (err) {
      res.status(500).json(err);
    }
  });
  
  //get user's all posts
  
  router.get("/posts/profile/:username", async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.username });
      const posts = await Post.find({ userId: user._id });
      res.status(200).json(posts);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  //update user


  router.put("/users/:id", async (req, res) => {
    if (req.body.userId === req.params.id || req.body.isAdmin) {
      if (req.body.password) {
        try {
          const salt = await bcrypt.genSalt(10);
          req.body.password = await bcrypt.hash(req.body.password, salt);
        } catch (err) {
          return res.status(500).json(err);
        }
      }
      try {
        const user = await User.findByIdAndUpdate(req.params.id, {
          $set: req.body,
        });
        res.status(200).json("Account has been updated");
      } catch (err) {
        return res.status(500).json(err);
      }
    } else {
      return res.status(403).json("You can update only your account!");
    }
  });
  
  //delete user
  router.delete("/users/:id", async (req, res) => {
    if (req.body.userId === req.params.id || req.body.isAdmin) {
      try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json("Account has been deleted");
      } catch (err) {
        return res.status(500).json(err);
      }
    } else {
      return res.status(403).json("You can delete only your account!");
    }
  });
  
  //get a user
  router.get("/users", async (req, res) => {
    const userId = req.query.userId;
    const username = req.query.username;
    try {
      const user = userId
        ? await User.findById(userId)
        : await User.findOne({ username: username });
      const { password, updatedAt, ...other } = user._doc;
      res.status(200).json(other);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  router.get("/allusers", async (req, res) => {
    try {
      const user = await User.find({});
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  router.get("/users/:username", async (req, res) => {
    try {
      const user = await Users.findById(req.params.username);
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  
  
  //get friends
  router.get("/users/friends/:userId", async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      const friends = await Promise.all(
        user.followings.map((friendId) => {
          return User.findById(friendId);
        })
      );
      let friendList = [];
      friends.map((friend) => {
        const { _id, username, profilePicture } = friend;
        friendList.push({ _id, username, profilePicture });
      });
      res.status(200).json(friendList)
    } catch (err) {
      res.status(500).json(err);
    }
  });
  
  //follow a user
  
  router.put("/users/:id/follow", async (req, res) => {
    if (req.body.userId !== req.params.id) {
      try {
        const user = await User.findById(req.params.id);
        const currentUser = await User.findById(req.body.userId);
        if (!user.followers.includes(req.body.userId)) {
          await user.updateOne({ $push: { followers: req.body.userId } });
          await currentUser.updateOne({ $push: { followings: req.params.id } });
          res.status(200).json("user has been followed");
        } else {
          res.status(403).json("you allready follow this user");
        }
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(403).json("you cant follow yourself");
    }
  });
  
  //unfollow a user
  
  router.put("/users/:id/unfollow", async (req, res) => {
    if (req.body.userId !== req.params.id) {
      try {
        const user = await User.findById(req.params.id);
        const currentUser = await User.findById(req.body.userId);
        if (user.followers.includes(req.body.userId)) {
          await user.updateOne({ $pull: { followers: req.body.userId } });
          await currentUser.updateOne({ $pull: { followings: req.params.id } });
          res.status(200).json("user has been unfollowed");
        } else {
          res.status(403).json("you dont follow this user");
        }
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(403).json("you cant unfollow yourself");
    }
  });
  

  router.get("/getdata" ,authenticate, (req,res)=>{
    console.log("hjeyy");
    if(!root.User){
      res.send({"_id":{"$oid":"64952f5ad5b796d503f6cd6d"},"username":"newuser","email":"newuser@gmail.com","password":"$2a$10$blIykhAN6w7Q5t7Hm.QRPuhEQ.yXFk99Umb32qq.MP.mU6wPm0ayG","confirmPassword":"$2a$10$PRZyFLY3qAXPICv1CrdLdueReNsjopilmtHQAWL0cZ6v01qHj4X92","profilePicture":"","coverPicture":"","followers":[],"followings":[],"isAdmin":false,"tokens":[],"createdAt":{"$date":{"$numberLong":"1687498586488"}},"updatedAt":{"$date":{"$numberLong":"1687498586488"}},"__v":{"$numberInt":"0"}})
    }
    res.send(req.rootUser);
  });

  
  // const storage = multer.diskStorage({
  //   destination: (req, file, cb) => {
  //     cb(null, "public/images");
  //   },
  //   filename: (req, file, cb) => {
  //     cb(null, req.body.name);
  //   },
  // });
  
  
  // const uploadprofile = multer({ storage: storage });
  // router.post("/uploadprofile", uploadprofile.single("profilefile"), async(req, res) => {
  //   try {
  //     var id=req.body.userId;
  //     var profilePic=req.file.path;
  //     const data= await User.findById(id);
  //     data.profilePicture=profilePic?profilePic:data.profilePicture;
      
  //     await data.save();
  //     return res.status(200).json("profilepic uploded successfully");
  //   } catch (error) {
  //     console.error(error);
  //   }
  // });
  



module.exports = router;
