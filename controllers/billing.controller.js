const Billing = require('../models/billing.model');
const Fund = require('../models/fund.model');
const Student = require('../models/student.model');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();


// Supabase Setup
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 📄 Generate PDF Bill
const generateBillPDF = (billing, student) => {
  return new Promise((resolve, reject) => {
    const fileName = `bill-${student.universityRollNo}-${Date.now()}.pdf`;
    const billsDir = path.join(__dirname, '..', 'temp');

    if (!fs.existsSync(billsDir)) fs.mkdirSync(billsDir, { recursive: true });

    const filePath = path.join(billsDir, fileName);
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    const festLogo = path.join(__dirname, '../public/ps-logo.png');
    const tmslLogo = path.join(__dirname, '../public/tmsl-logo.png');
    const foodIcon = billing.foodCoupon
      ? path.join(__dirname, '../public/icons/fastfood.png')
      : path.join(__dirname, '../public/icons/nofood.png');

    doc.image(festLogo, 40, 40, { height: 60 });
    doc.image(tmslLogo, doc.page.width - 160, 44, { height: 40 });

    doc.font('Helvetica-Bold').fontSize(20).text('Phase Shift', 120, 45);
    doc.font('Helvetica').fontSize(12).text('Department of Electrical Engineering', 120, 70).text('Techno Main Salt Lake');
    doc.font('Helvetica-Bold').fontSize(12).text(`Date: ${new Date(billing.paymentDate).toLocaleDateString()}`, 40, 120);

    const drawSectionHeader = (title, y) => {
      doc.fillColor('#E91E63').rect(40, y, doc.page.width - 80, 25).fill();
      doc.fillColor('white').font('Helvetica-Bold').fontSize(13).text(title, 50, y + 6);
    };

    const drawKeyValueRow = (label, value, y) => {
      doc.fillColor('black').font('Helvetica').fontSize(12).text(label, 50, y).font('Helvetica-Bold').text(value, 220, y);
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

    writeStream.on('finish', () => {
      resolve({ filePath, fileName });
    });

    writeStream.on('error', reject);
  });
};


// 📤 Upload to Supabase
const uploadToSupabase = async (localPath, remoteFileName) => {
  const fileBuffer = fs.readFileSync(localPath);

  const { data, error } = await supabase.storage.from('bills').upload(remoteFileName, fileBuffer, {
    contentType: 'application/pdf',
    upsert: true,
  });

  fs.unlinkSync(localPath); // cleanup local file
  if (error) throw new Error('Failed to upload to Supabase Storage');

  const publicUrl = `${process.env.SUPABASE_PUBLIC_URL}/${process.env.SUPABASE_BUCKET}/${remoteFileName}`;
  return publicUrl;
};

// 📧 Email
const sendBillEmail = async (email, pdfURL) => {
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
        <p>Thank you for registering for the <strong>Phase Shift</strong> organized by the 
        <strong>Department of Electrical Engineering</strong> at <strong>Techno Main Salt Lake</strong>.</p>
        
        <p>📎 <a href="${pdfURL}" target="_blank">Click here to download your bill</a></p>
        <p>🚀 See you at the fest!</p>
      
      
      
        <h3 style="margin-top: 25px; color: #1976D2;">🎯 Events & Registration Links</h3>
        <ul style="line-height: 1.6; padding-left: 20px;">
          <li>Model Making: <a href="https://forms.gle/XyZ123AbcDEfGh789">Register</a></li>
          <li>Circuit Making: <a href="https://forms.gle/XyZ123AbcDEfGh789">Register</a></li>
          <li>Idea Presentation: <a href="https://forms.gle/XyZ123AbcDEfGh789">Register</a></li>
          <li>Debate: <a href="https://forms.gle/XyZ123AbcDEfGh789">Register</a></li>
          <li>Quiz: <a href="https://forms.gle/XyZ123AbcDEfGh789">Register</a></li>
          <li>Photography: <a href="https://forms.gle/XyZ123AbcDEfGh789">Register</a></li>
          <li>Gaming: <a href="https://forms.gle/XyZ123AbcDEfGh789">Register</a></li>
          <li>Chess: <a href="https://forms.gle/XyZ123AbcDEfGh789">Register</a></li>
          <li>Uno: <a href="https://forms.gle/XyZ123AbcDEfGh789">Register</a></li>
          <li>Treasure Hunt: <a href="https://forms.gle/XyZ123AbcDEfGh789">Register</a></li>
        </ul>
        
        
        <hr style="margin: 30px 0;" />
        <p style="font-size: 15px;">
          📸 Follow us on Instagram: 
          <a href="https://www.instagram.com/_phaseshift_?igsh=MXI3dGU5ajZrdm1pYg==" target="_blank" style="color: #E91E63;">
            @_phaseshift_
          </a>
        </p>
        <p style="color: #888; font-size: 14px; margin-top: 30px;">
          Regards,<br />
          <strong>Phase Shift 2025 Team</strong>
        </p>
      </div>
      
      `
    ,
  };

  await transporter.sendMail(mailOptions);
};

// 📌 Bill Controller
exports.billStudent = async (req, res) => {
  try {
    const { studentRollNo, paymentMode, transactionId, foodCoupon, phone, email } = req.body;
    const screenshot = req.file ? req.file.path : '';
    const student = await Student.findOne({ universityRollNo: studentRollNo.trim() });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const amount = foodCoupon === 'true' ? 300 : 150;
    const billing = new Billing({
      student: student._id,
      paymentMode,
      transactionId,
      screenshot,
      foodCoupon: foodCoupon === 'true',
      amount,
      phone,
      email,
    });

    await billing.save();

    let fund = await Fund.findOne();
    fund ? (fund.totalFund += amount) : (fund = new Fund({ totalFund: amount }));
    await fund.save();

    const { filePath, fileName } = await generateBillPDF(billing, student);
    const pdfURL = await uploadToSupabase(filePath, fileName);

    billing.billFileName = pdfURL;
    await billing.save();

    await sendBillEmail(email, pdfURL);
    res.status(201).json({ message: 'Billing successful, email sent 🎉' });
  } catch (error) {
    console.error('Billing error:', error);
    res.status(500).json({ message: 'Billing failed' });
  }
};

// 📊 Stats
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
