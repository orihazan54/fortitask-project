const express = require("express");
const router = express.Router();

let assignments = []; // מערך לדוגמה לאחסון משימות

// יצירת משימה חדשה
router.post("/", (req, res) => {
  const { name, dueDate } = req.body;

  if (!name || !dueDate) {
    return res.status(400).json({ message: "Name and due date are required." });
  }

  const newAssignment = {
    id: assignments.length + 1,
    name,
    dueDate,
    createdAt: new Date(),
  };

  assignments.push(newAssignment);
  res.status(201).json({
    message: "Assignment created successfully!",
    assignment: newAssignment,
  });
});

// משיכת כל המשימות
router.get("/", (req, res) => {
  res.status(200).json(assignments);
});

// מחיקת משימה
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const index = assignments.findIndex((assignment) => assignment.id == id);

  if (index === -1) {
    return res.status(404).json({ message: "Assignment not found." });
  }

  assignments.splice(index, 1);
  res.status(200).json({ message: "Assignment deleted successfully." });
});

module.exports = router;
