const mongoose = require("mongoose");
const jwt =require('jsonwebtoken');
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      min: 3,
      max: 20,
      
    },
    email: {
      type: String,
      required: true,
      max: 50,
      unique:true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
    },
    confirmPassword: {
      type: String,
      required: true,
      min: 6,
    },
   
    profilePicture: {
      type: String,
      default: "",
    },
    coverPicture: {
      type: String,
      default: "",
    },
    followers: {
      type: Array,
      default: [],
    },
    followings: {
      type: Array,
      default: [],
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    desc: {
      type: String,
      max: 50,
    },
    city: {
      type: String,
      max: 50,
    },
    from: {
      type: String,
      max: 50,
    },
    relationship: {
      type: Number,
      enum: [1, 2, 3],
    },
    tokens: [
      {
        token:{
          type: String,
          required:true
        }
      }
    ]
    
    
    
    
    
  },
  { timestamps: true }
);

UserSchema.methods.generateAuthToken = async function () {
  try{
    console.log(this._id);
    let token=jwt.sign({_id: this._id},"SAURABHISAGOODBOYHEISHANDSOMEBOYBOYWITHGOODSENSEOFHUMOURBUTSTLLSINGLE");
    this.tokens=this.tokens.concat({token:token});
    await this.save();
    return token;
  } catch(err){
    console.log(err);
  }
}

module.exports = mongoose.model("User", UserSchema);
