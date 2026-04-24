import db from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"


// ======= Signup =========
export const signup=(req,res)=>{

const {name,email,password} =req.body;

// Validation
if(!name || !email || !password){
    return res.status(400).json({message:"All fields are required"});
}

// email format check
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if(!emailRegex.test(email)){
    return res.status(400).json({message:"Inavlid email format"});
}

if(password.length < 6){
    return res.status(400).json({message:"Password must be atleast 6 characters"})
}

// Password hash
const hashedPassword = bcrypt.hashSync(password,10);

const query = "INSERT INTO users (name,email,password) VALUES(?,?,?)";

db.query(query,[name,email,hashedPassword],(err,result)=>{
    if(err){
        console.log(err);
        return res.status(500).json({message:"Error inserting user"});

    }
    res.status(201).json({message:"User created successfully"

    });
});
}


// ====== Login ==========
export const login = (req,res)=>{

    //req -> data coming from user ,  res -> response (what you send back)
    const {email,password} = req.body;

    // Validation
    if(!email || !password){
        return res.status(400).json({message:"Email and password required"});
    }

    const query = "SELECT * FROM users where email = ?";

    db.query(query,[email],(err,result)=>{
        if(err){
            console.log(err);
            return res.status(500).json({error:err.message});
        }

        if(result.length === 0){
            return res.status(404).json({message:"User not found"});
        }

        const user = result[0];

        // Password Compare
        const isMatch  = bcrypt.compareSync(password,user.password);

        if(!isMatch){
            return res.status(401).json({message:"Invalid Credentials"})
        }

        // JWT TOken
        const token = jwt.sign(
            {id:user.id, email: user.email},
             process.env.JWT_SECRET,
            {expiresIn: "1d"}
        );

        res.json({message:"Login Successful",token})
        

    })

}

