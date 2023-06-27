const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");

const router = express.Router();
const path = require("path");
const cors=require("cors");
const cookieParser=require('cookie-parser');
app.use(cookieParser());
app.use(express.static(path.join(__dirname,'/public'))); 

app.use('/images', express.static('images'));
dotenv.config();


app.use(express.json());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(cors());

const PORT = process.env.PORT || 8800;

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
   console.log("MongoDB connected successfully");

    
  })
  .catch((error) => console.log(`${error} did not connect`));

const server=app.listen(PORT, () => console.log(`Server Port: ${PORT}`));;


  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "public/images");
    },
    filename: (req, file, cb) => {
      cb(null, req.body.name);
    },
  });
  
  const upload = multer({ storage: storage });
  app.post("/upload", upload.single("file"), (req, res) => {
    try {
      return res.status(200).json("File uploded successfully");
    } catch (error) {
      console.error(error);
    }
  });
  // const uploadprofile = multer({ storage: storage });
  app.post("/uploadprofile", upload.single("profilePicture"), async(req, res,next) => {
    try {
      var id=req.body.userkaId;
      var profilePic=req.file.destination;
      const data= await User.findById(id);
      data.profilePicture=profilePic?profilePic:data.profilePicture;
      
      await data.save();
      return res.status(200).json("profilepic uploded successfully");
    } catch (error) {
      console.error(error);
    }
  });
  


  
  app.use(require('./router/auth'));


const io = require("socket.io")(server, {
  cors: {
    origin: '*',
  },
});

let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  //when ceonnect
  console.log("a user connected.");

  //take userId and socketId from user
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  //send and get message
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);
    io.to(user?.socketId).emit("getMessage", {
      senderId,
      text,
    });
  });

  //when disconnect
  socket.on("disconnect", () => {
    console.log("a user disconnected!");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});
