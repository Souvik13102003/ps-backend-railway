// controllers/student.controller.js
const Student = require("../models/student.model");
const XLSX = require("xlsx");

exports.uploadStudentsFromExcel = async (req, res) => {
  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const studentsFromExcel = XLSX.utils.sheet_to_json(sheet);

    let inserted = 0;
    for (let row of studentsFromExcel) {
      const {
        "University Roll No": roll,
        Name: name,
        Year: year,
        Section: section,
      } = row;

      if (!roll || !name || !year || !section) continue;

      const existing = await Student.findOne({ universityRollNo: roll });
      if (existing) continue;

      await Student.create({
        universityRollNo: roll,
        name,
        year,
        section,
        hasPaid: false, // explicitly setting default
      });
      inserted++;
    }

    return res
      .status(200)
      .json({ message: `${inserted} students inserted successfully.` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error uploading Excel file" });
  }
};


exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({
      year: 1,
      section: 1,
      name: 1,
    });
    return res.status(200).json(students);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch students" });
  }
};

exports.addStudentManually = async (req, res) => {
  try {
    const { universityRollNo, name, year, section } = req.body;

    if (!universityRollNo || !name || !year || !section) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await Student.findOne({ universityRollNo });
    if (exists) {
      return res.status(400).json({ message: "Student already exists" });
    }

    const student = new Student({ universityRollNo, name, year, section });
    await student.save();
    return res
      .status(201)
      .json({ message: "Student added successfully", student });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to add student" });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const student = await Student.findByIdAndUpdate(id, updates, { new: true });
    if (!student) return res.status(404).json({ message: "Student not found" });

    return res.status(200).json({ message: "Student updated", student });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update student" });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByIdAndDelete(id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    return res.status(200).json({ message: "Student deleted", student });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete student" });
  }
};

// Mark student as Paid
exports.markStudentAsPaid = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { universityRollNo: req.params.rollNo },
      { hasPaid: true },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res
      .status(200)
      .json({ message: "Payment status updated to Paid", student });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update payment status" });
  }
};

// Get student by roll number
exports.getStudentByRollNo = async (req, res) => {
  try {
    const student = await Student.findOne({ universityRollNo: req.params.rollNo });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Count stats: total, paid, unpaid
exports.getStudentStats = async (req, res) => {
  try {
    const total = await Student.countDocuments();
    const paid = await Student.countDocuments({ hasPaid: true });
    const notPaid = total - paid;

    return res.status(200).json({ total, paid, notPaid });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch student stats" });
  }
};

