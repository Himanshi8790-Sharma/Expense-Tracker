import db from "../db.js";
import bcrypt from "bcryptjs";

// GET USER
export const getUser = (req, res) => {
 const user_id = req.user.id;

  db.query("SELECT * FROM users WHERE id = ?", [user_id], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result[0]);
  });
};

// UPDATE USER
export const updateUser = (req, res) => {
  const user_id = req.user.id;
  const { name, email, phone, currency, language, avatar } = req.body;

  const query = `
    UPDATE users 
    SET name=?, email=?, phone=?, currency=?, language=?, avatar=? 
    WHERE id=?
  `;

  db.query(
    query,
    [name, email, phone, currency, language, avatar, user_id],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json({ message: "Profile updated successfully" });
    }
  );
};

// Password update
export const changePassword = (req, res) => {
  const userId = req.user.id;

  const { currentPassword, newPassword } = req.body;

  const query = "SELECT password FROM users WHERE id=?";

  db.query(query, [userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Error" });

    const user = result[0];

    const isMatch = bcrypt.compareSync(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password incorrect" });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);

    db.query(
      "UPDATE users SET password=? WHERE id=?",
      [hashed, userId],
      (err) => {
        if (err) return res.status(500).json({ message: "Update failed" });

        res.json({ message: "Password updated" });
      }
    );
  });
};

// data fetch
export const exportData = (req, res) => {
  const user_id = req.user.id;
  const type = req.query.type?.toString().trim().toLowerCase();

  if (!type) {
    return res.status(400).json({ message: "Type is required" });
  }

  // const query = "SELECT * FROM transactions WHERE user_id = ?";
  const query = "SELECT * FROM expenses WHERE user_id = ?";

  db.query(query, [user_id], (err, data) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.status(500).json({ message: "Error fetching data" });
    }

    if (!data || data.length === 0) {
      return res.status(200).send("No data");
    }

    if (type === "json") {
      return res.json(data);
    }

    if (type === "csv") {
      let csv = "amount,type,date\n";

      data.forEach(row => {
        csv += `${row.amount || 0},${row.type || ""},${row.date || row.created_at || ""}\n`;
      });

      res.header("Content-Type", "text/csv");
      res.attachment("data.csv");
      return res.send(csv);
    }

    return res.status(400).json({ message: "Invalid type" });
  });
};

export const clearData = (req, res) => {
  const user_id = req.user.id;

  db.query("DELETE FROM expenses WHERE user_id = ?", [user_id], (err) => {
    if (err) return res.status(500).json({ message: "Error deleting data" });

    res.json({ message: "All data cleared" });
  });
};
export const deleteAccount = (req, res) => {
  const user_id = req.user.id;

  db.query("DELETE FROM users WHERE id = ?", [user_id], (err) => {
    if (err) return res.status(500).json({ message: "Error deleting account" });

    res.json({ message: "Account deleted" });
  });
};



