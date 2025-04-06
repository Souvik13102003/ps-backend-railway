// backend/controllers/billing.controller.js
const Billing = require('../models/billing.model');
const Fund = require('../models/fund.model');
const Student = require('../models/student.model');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const nodeHtmlToImage = require('node-html-to-image');
require('dotenv').config();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Generate Bill as PNG
const generateBillImage = async (billing, student) => {
  const fileName = `bill-${student.universityRollNo}-${Date.now()}.png`;
  const filePath = path.join(__dirname, '..', 'temp', fileName);

  if (!fs.existsSync(path.join(__dirname, '..', 'temp'))) {
    fs.mkdirSync(path.join(__dirname, '..', 'temp'));
  }

  const foodIconURL = billing.foodCoupon
    ? 'https://cdn-icons-png.flaticon.com/512/3595/3595455.png' // food icon
    : 'https://cdn-icons-png.flaticon.com/512/3595/3595412.png'; // no food

  await nodeHtmlToImage({
    output: filePath,
    type: 'png',
    quality: 100,
    html: `
      <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', sans-serif;
              padding: 30px;
              border: 1px solid #ddd;
              width: 800px;
              background: #fff;
            }
            h1 {
              text-align: center;
              color: #E91E63;
              margin-bottom: 0;
            }
            h3 {
              text-align: center;
              margin-top: 5px;
              color: #555;
            }
            .info-section {
              margin-top: 30px;
              border-top: 2px solid #eee;
              padding-top: 20px;
            }
            .row {
              margin: 10px 0;
              font-size: 16px;
            }
            .row strong {
              width: 160px;
              display: inline-block;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
            }
          </style>
        </head>
        <body>
          <h1>Phase Shift 2025</h1>
          <h3>Department of Electrical Engineering</h3>
          <h3>Techno Main Salt Lake</h3>

          <div class="info-section">
            <h2>Student Details</h2>
            <div class="row"><strong>Name:</strong> ${student.name}</div>
            <div class="row"><strong>University Roll No:</strong> ${student.universityRollNo}</div>
            <div class="row"><strong>Year:</strong> ${student.year}</div>
            <div class="row"><strong>Section:</strong> ${student.section}</div>
          </div>

          <div class="info-section">
            <h2>Payment Details</h2>
            <div class="row"><strong>Payment Mode:</strong> ${billing.paymentMode}</div>
            <div class="row"><strong>Transaction ID:</strong> ${billing.transactionId || 'N/A'}</div>
            <div class="row"><strong>Amount Paid:</strong> ₹${billing.amount}</div>
            <div class="row"><strong>Food Coupon:</strong> ${billing.foodCoupon ? 'Yes' : 'No'}</div>
          </div>

          <div class="footer">
            <img src="${foodIconURL}" height="100" alt="Food Icon"/>
          </div>
        </body>
      </html>
    `,
  });

  return filePath;
};

// Upload Image to Cloudinary
const uploadImageToCloudinary = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'phase-shift-bills',
    use_filename: true,
    unique_filename: false,
  });

  fs.unlinkSync(filePath); // clean up
  return result.secure_url;
};

// Send Bill Email
const sendBillEmail = async (email, billURL) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: '"Phase Shift Billing" <yourgmail@gmail.com>',
    to: email,
    subject: '🎉 Your Bill for Phase Shift 2025',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #E91E63;">Phase Shift 2025 - Registration Confirmed</h2>
        <p>Dear Student,</p>
        <p>Thank you for registering for the <strong>Phase Shift</strong> fest organized by the 
        <strong>Department of Electrical Engineering</strong> at <strong>Techno Main Salt Lake</strong>.</p>

        <p>📅 <strong>Dates:</strong> 25th - 26th April 2025</p>
        <p>📍 <strong>Venue:</strong> Techno Main Salt Lake</p>

        <p>📎 <a href="${billURL}" target="_blank">Click here to view/download your bill</a></p>

        <p style="margin-top: 30px;">See you at the fest! 🚀</p>
        <p style="color: #888;">Regards, <br/><strong>Phase Shift 2025 Team</strong></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Controller: Bill a Student
exports.billStudent = async (req, res) => {
  try {
    const { studentRollNo, paymentMode, transactionId, foodCoupon, phone, email } = req.body;
    const student = await Student.findOne({ universityRollNo: studentRollNo.trim() });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const amount = foodCoupon === 'true' ? 300 : 150;

    const billing = new Billing({
      student: student._id,
      paymentMode,
      transactionId,
      screenshot: req.file?.path || '',
      foodCoupon: foodCoupon === 'true',
      amount,
      phone,
      email,
    });
    await billing.save();

    let fund = await Fund.findOne();
    fund ? (fund.totalFund += amount) : (fund = new Fund({ totalFund: amount }));
    await fund.save();

    const billImagePath = await generateBillImage(billing, student);
    const billURL = await uploadImageToCloudinary(billImagePath);

    billing.billFileName = billURL;
    await billing.save();

    await sendBillEmail(email, billURL);

    res.status(201).json({ message: 'Billing successful, email sent 🎉' });
  } catch (error) {
    console.error('Billing error:', error);
    res.status(500).json({ message: 'Billing failed' });
  }
};

// Get Stats
exports.getPaymentStats = async (req, res) => {
  try {
    const totalOnline = await Billing.countDocuments({ paymentMode: 'Online' });
    const totalCash = await Billing.countDocuments({ paymentMode: 'Cash' });
    const totalFoodCoupons = await Billing.countDocuments({ foodCoupon: true });
    res.json({ totalOnline, totalCash, totalFoodCoupons });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment stats" });
  }
};

// Get All Bills
exports.getAllBills = async (req, res) => {
  try {
    const bills = await Billing.find()
      .populate('student', 'name universityRollNo')
      .sort({ paymentDate: -1 });

    const response = bills.map(bill => ({
      _id: bill._id,
      studentName: bill.student.name,
      rollNo: bill.student.universityRollNo,
      paymentMode: bill.paymentMode,
      foodCoupon: bill.foodCoupon,
      billFileName: bill.billFileName,
      paymentDate: bill.paymentDate,
    }));

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch bills" });
  }
};
