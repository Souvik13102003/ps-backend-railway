// backend/controllers/billing.controller.js
const Billing = require('../models/billing.model');
const Fund = require('../models/fund.model');
const Student = require('../models/student.model');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📄 Generate PDF Bill
const generateBillPDF = (billing, student) => {
  return new Promise((resolve, reject) => {
    const tempFilename = `bill-${student.universityRollNo}-${Date.now()}.pdf`;
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const filePath = path.join(tempDir, tempFilename);
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    const festLogo = path.join(__dirname, '../public/ps-logo.png');
    const tmslLogo = path.join(__dirname, '../public/tmsl-logo.png');
    const foodIcon = billing.foodCoupon
      ? path.join(__dirname, '../public/icons/fastfood.png')
      : path.join(__dirname, '../public/icons/nofood.png');

    doc.image(festLogo, 40, 40, { height: 60 });
    doc.image(tmslLogo, doc.page.width - 160, 44, { height: 40 });

    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .text('Phase Shift', 120, 45)
      .fontSize(12)
      .text('Department of Electrical Engineering', 120, 70)
      .text('Techno Main Salt Lake');

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(`Date: ${new Date(billing.paymentDate).toLocaleDateString()}`, 40, 120);

    const drawSectionHeader = (title, y) => {
      doc.fillColor('#E91E63')
        .rect(40, y, doc.page.width - 80, 25)
        .fill()
        .fillColor('white')
        .font('Helvetica-Bold')
        .fontSize(13)
        .text(title, 50, y + 6);
    };

    const drawKeyValueRow = (label, value, y) => {
      doc
        .fillColor('black')
        .font('Helvetica')
        .fontSize(12)
        .text(label, 50, y)
        .font('Helvetica-Bold')
        .text(value, 220, y);
    };

    let y = 160;
    drawSectionHeader('Student Details', y); y += 35;
    drawKeyValueRow('Name', student.name, y); y += 25;
    drawKeyValueRow('University Roll No', student.universityRollNo, y); y += 25;
    drawKeyValueRow('Year', student.year, y); y += 25;
    drawKeyValueRow('Section', student.section, y); y += 35;

    drawSectionHeader('Payment Details', y); y += 35;
    drawKeyValueRow('Payment Mode', billing.paymentMode, y); y += 25;
    drawKeyValueRow('Transaction ID', billing.transactionId || 'N/A', y); y += 25;
    drawKeyValueRow('Amount Paid', `${billing.amount} /-`, y); y += 25;
    drawKeyValueRow('Food Coupon', billing.foodCoupon ? 'Yes' : 'No', y); y += 50;

    const iconSize = 80;
    const centerX = (doc.page.width - iconSize) / 2;
    doc.image(foodIcon, centerX, y, { width: iconSize });

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', (err) => reject(err));
  });
};

// 📤 Upload PDF to Cloudinary
const uploadPDFToCloudinary = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: 'auto',
    folder: 'phase-shift-bills',
    use_filename: true,
    unique_filename: false,
  });

  fs.unlinkSync(filePath);
  return result.secure_url;
};

// 📧 Send Bill via Email
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
        <p>Hello!</p>
        <p>Thank you for registering for the <strong>Phase Shift</strong> fest organized by the 
        <strong>Department of Electrical Engineering</strong> at <strong>Techno Main Salt Lake</strong>.</p>
        <p><strong>🗓 Dates:</strong> 25th - 26th April 2025</p>
        <p><strong>📍 Venue:</strong> Techno Main Salt Lake Campus</p>
        <p style="margin-top: 20px;">📎 <a href="${billURL}" target="_blank">Click here to view/download your bill</a></p>
        <p style="color: #888; font-size: 14px; margin-top: 30px;">Regards,<br /><strong>Phase Shift 2025 Team</strong></p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// 🧾 BILL CONTROLLER
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

    const pdfPath = await generateBillPDF(billing, student);
    const billURL = await uploadPDFToCloudinary(pdfPath);

    billing.billFileName = billURL;
    await billing.save();

    await sendBillEmail(email, billURL);

    res.status(201).json({ message: 'Billing successful, email sent 🎉' });
  } catch (error) {
    console.error('Billing error:', error);
    res.status(500).json({ message: 'Billing failed' });
  }
};

// 📊 Payment Stats
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

// 📁 All Bills
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
