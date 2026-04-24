import express from "express";
import cors from "cors";
import db from "./db.js";
import authRoutes from "./routes/authRoutes.js";
import expenseRoutes from "./routes/expenseRouter.js";
import incomeRoutes from "./routes/incomeRouter.js";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";


dotenv.config();
// console.log("JWT SECRET 👉", process.env.JWT_SECRET);

const app = express();

app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);

app.use("/api/expenses",expenseRoutes);
app.use("/api/income",incomeRoutes);
app.use("/api/user", userRoutes);



app.get("/",(req,res)=>{
res.send("API is working");
});

app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});