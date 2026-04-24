import express from "express"
import { verifyToken } from "../middleware/authmiddleware.js";

import { addExpense,getExpense,deleteExpense,getSummary,getCategoryExpense, getMonthlyExpenses,updateExpense } from "../controllers/expensecontroller.js";

const router = express.Router();

router.post("/add",verifyToken,addExpense);
router.get("/",verifyToken,getExpense);
router.delete("/:id",verifyToken,deleteExpense);
router.get("/summary",verifyToken,getSummary);
router.get("/category",verifyToken,getCategoryExpense);
router.get("/monthly",verifyToken,getMonthlyExpenses);
router.put("/:id",verifyToken,updateExpense);

export default router;