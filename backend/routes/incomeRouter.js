import express from "express";
import { addIncome, getIncome, getTotalIncome,deleteIncome,updateIncome } from "../controllers/incomeController.js";
import {verifyToken} from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/add", verifyToken, addIncome);
router.get("/", verifyToken, getIncome);
router.get("/total", verifyToken, getTotalIncome);
router.delete("/:id", verifyToken, deleteIncome);
router.put("/:id", verifyToken, updateIncome);


export default router;