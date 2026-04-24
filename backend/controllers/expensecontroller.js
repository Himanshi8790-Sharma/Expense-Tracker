import db from "../db.js";

// Add expense
export const addExpense = (req,res)=>{
    //req -> data coming from user ,  res -> response (what you send back) ?->Placeholder
    const { title,amount,category} = req.body;

    // Validation

    if(!title || !amount || !category){
        return res.status(400).json({message:"All fields are required"});
    }

    if(isNaN(amount)){
        return res.status(400).json({message:"Amount must be a number"});
    }

    if(amount<=0){
        return res.status(400).json({message:"Amount must be greater than 0"});
    }
    const user_id = req.user.id;   //now req.id no come to a client insted of req.user.id

    const query = `INSERT INTO expenses (user_id,title , amount , category)VALUES (?,?,?,?)`;

    db.query(query,[user_id,title,amount,category],(err,result)=>{
        if(err){
            return res.status(500).json({error:err.message});
        }

        res.status(201).json({message:"Expense added"})
    });
};

// Get expense 
export const getExpense = (req,res)=>{
    const user_id = req.user.id;  

    const query = "SELECT * FROM expenses  where user_id=?";

db.query(query,[user_id],(err,result)=>{
    if(err){
        return res.status(500).json({error:err.message});
    }

    res.json(result);  //result mai expense data aayega uska client ko bhej do
})

}

// Delete expense 
export const deleteExpense = (req,res)=>{
    const {id}= req.params;
    const user_id = req.user.id;

    const query =  "DELETE FROM expenses where id = ?";

    db.query(query,[id,user_id],(err,result)=>{
        if(err){
            return res.status(500).json({error:err.message});
        }

        res.json({message:"Expense deleted"})
    })
}

// Update expense
export const updateExpense = (req,res)=>{
    const {id} = req.params;
    const {title,amount,category} = req.body;
    const user_id = req.user.id;

    // Validation
    if(!title || !amount || !category){
        return res.status(400).json({message:"All fields are required"});
    }

    if(isNan(amount) || amount <=0){
        return res.status(400).json({message:"Inavalid amount"});
    }

    const query = `UPDATE expenses SET title = ?,amount = ?,category=?
    WHERE id=? AND user_id=?`;

    db.query(query, [title, amount, category, id, user_id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Failed to update expense ❌" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found ❌" });
    }

    res.json({ message: "Expense updated successfully ✅" });
  });
};

// Total expense 
export const getSummary = (req,res)=>{
    const user_id = req.user.id;

    const expenseQuery = "SELECT SUM(amount) AS expense FROM expenses WHERE user_id=?";
    const incomeQuery = "SELECT SUM(amount) AS income FROM income WHERE user_id=?";

    db.query(expenseQuery,[user_id],(err,expenseResult)=>{
        if(err) return res.status(500).json({error:err.message});

        db.query(incomeQuery,[user_id],(err,incomeResult)=>{
            if(err) return res.status(500).json({error:err.message});

            const totalExpense = expenseResult[0].expense || 0;
            const totalIncome = incomeResult[0].income || 0;
            const totalBalance = totalIncome - totalExpense;
            const savingsRate = totalIncome > 0 
                ? ((totalBalance / totalIncome) * 100).toFixed(2) 
                : 0;

            res.json({
                totalExpense,
                totalIncome,
                totalBalance,
                savingsRate
            });
        });
    });
};

// Categories-wise expense
export const getCategoryExpense =(req,res)=>{
const user_id = req.user.id;

const query = `SELECT category,SUM(amount)  AS total from expenses where user_id=? Group by category `;

db.query(query,[user_id],(err,result)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(result);
});
};


// Monthly wise
export const getMonthlyExpenses =(req,res)=>{
    const user_id=req.user.id;
   
    const query = `SELECT MONTH(created_at) AS month,
                    Sum(amount) AS total from expenses where user_id=? 
                    Group BY Month(created_at) 
                    Order By month ASC`;
    db.query(query,[user_id],(err,result)=>{
        if(err){
            return res.status(500).json({error:err.message});
        }
        res.json(result);
    });
}

