// routes/student.routes.js
const express = require("express");
const router = express.Router();
const upload = require("../middlewares/MulterExcel");
const { protect } = require("../middlewares/auth.middleware");
const { getStudentStats } = require("../controllers/student.controller");


const {
  uploadStudentsFromExcel,
  getAllStudents,
  addStudentManually,
  updateStudent,
  deleteStudent,
  markStudentAsPaid,
  getStudentByRollNo
} = require("../controllers/student.controller");

// @route   POST /api/students/upload-excel
// @desc    Upload students from Excel
router.post(
  "/upload-excel",
  protect,
  upload.single("file"),
  uploadStudentsFromExcel
);

// @route   GET /api/students/
// @desc    Get all students
router.get("/", protect, getAllStudents);

// @route   POST /api/students/manual
// @desc    Manually add a student
router.post("/manual", protect, addStudentManually);

// @route   PUT /api/students/:id
// @desc    Update a student
router.put("/:id", protect, updateStudent);

// @route   DELETE /api/students/:id
// @desc    Delete a student
router.delete("/:id", protect, deleteStudent);

// @route   PUT /api/students/mark-paid/:rollNo
// @desc    Mark a student as Paid by roll number
router.put("/mark-paid/:rollNo", protect, markStudentAsPaid);

// @route GET /api/students/roll/:rollNo
router.get('/roll/:rollNo', protect, getStudentByRollNo);

// @route GET /api/students/stats
router.get("/stats", protect, getStudentStats);


module.exports = router;
