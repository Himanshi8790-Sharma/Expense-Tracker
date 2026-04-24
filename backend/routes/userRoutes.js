import express from "express";
import { getUser, updateUser,changePassword,clearData,deleteAccount,exportData } from "../controllers/userController.js";
import { verifyToken } from "../middleware/authmiddleware.js";


const router = express.Router();

router.get("/",verifyToken,getUser);
router.put("/",verifyToken,updateUser);
router.put("/change-password/",verifyToken, changePassword);
router.get("/export", verifyToken, exportData);
router.delete("/clear-data",verifyToken, clearData);
router.delete("/delete", verifyToken, deleteAccount);


export default router;