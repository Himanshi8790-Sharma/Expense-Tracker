import db from "../db.js";

// ADD income
export const addIncome = (req,res)=>{
    const {source,amount} = req.body;
    const user_id = req.user.id;

    if(!source || !amount){
        return res.status(400).json({message:"All fields are required"});
    }

    const query = "INSERT INTO income (user_id,source,amount) VALUES (?,?,?)";

    db.query(query,[user_id,source,amount],(err,result)=>{
        if(err) return res.status(500).json({error:err.message});
        res.json({message:"Income added"});
    })
};

// Get all income
export const getIncome =(req,res)=>{
    const user_id = req.user.id;

    const query = "SELECT * FROM income where user_id=?";

    db.query(query,[user_id],(err,result)=>{
        if(err) return res.status(500).json({error:err.message});
        res.json(result);
    })
};

// Total Income
export const getTotalIncome = (req,res)=>{
    const user_id = req.user.id;

    const query = "SELECT SUM(amount) as total FROM income where user_id=?";

    db.query(query,[user_id],(err,result)=>{
        if(err) return res.status(500).json({error:err.message});
        res.json({totalIncome:result[0].total || 0});
    })
}

// Delete 
export const deleteIncome = (req, res) => {
    const income_id = req.params.id;
    const user_id = req.user.id;

    const query = "DELETE FROM income WHERE id=? AND user_id=?";

    db.query(query, [income_id, user_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Income not found" });
        }

        res.json({ message: "Income deleted successfully" });
    });
};

// update
export const updateIncome = (req, res) => {
    const income_id = req.params.id;
    const user_id = req.user.id;

    const { source, amount } = req.body;

    if (!source || !amount) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const query = `
        UPDATE income 
        SET source=?, amount=? 
        WHERE id=? AND user_id=?
    `;

    db.query(query, [source, amount, income_id, user_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Income not found" });
        }

        res.json({ message: "Income updated successfully" });
    });
};