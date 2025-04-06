const Billing = require('../models/billing.model');
const Fund = require('../models/fund.model');
const Student = require('../models/student.model');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const generateBillPDF = async (billing, student) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const fileName = `bill-${student.universityRollNo}-${Date.now()}.pdf`;
  const billsDir = path.join('public', 'bills');
  const filePath = path.join(billsDir, fileName);

  if (!fs.existsSync(billsDir)) {
    fs.mkdirSync(billsDir, { recursive: true });
  }

  const festLogo = path.join(__dirname, '../public/ps-logo.png');
  const tmslLogo = path.join(__dirname, '../public/tmsl-logo.png');
  const foodIcon = billing.foodCoupon
    ? path.join(__dirname, '../public/icons/fastfood.png')
    : path.join(__dirname, '../public/icons/nofood.png');

  doc.pipe(fs.createWriteStream(filePath));

  const logoHeight = 60;
  doc.image(festLogo, 40, 40, { height: logoHeight });
  doc.image(tmslLogo, doc.page.width - 160, 44, { height: 40 });

  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor('black')
    .text('Phase Shift', 120, 45);

  doc
    .font('Helvetica')
    .fontSize(12)
    .fillColor('black')
    .text('Department of Electrical Engineering', 120, 70)
    .text('Techno Main Salt Lake');

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(`Date: ${new Date(billing.paymentDate).toLocaleDateString()}`, 40, 120);

  const drawSectionHeader = (title, y) => {
    doc
      .fillColor('#E91E63')
      .rect(40, y, doc.page.width - 80, 25)
      .fill();
    doc
      .fillColor('white')
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(title, 50, y + 6);
  };

  const drawKeyValueRow = (label, value, y) => {
    const col1X = 50;
    const col2X = 220;
    doc
      .fillColor('black')
      .font('Helvetica')
      .fontSize(12)
      .text(label, col1X, y);
    doc
      .font('Helvetica-Bold')
      .text(value, col2X, y);
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
  return filePath;
};

const sendBillEmail = async (email, pdfPath) => {
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
        <p style="margin-top: 20px;">📎 Your bill is attached as a PDF with this email.</p>
        <p style="margin-top: 30px;">See you at the fest! 🚀</p>
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
    `,
    attachments: [{ filename: path.basename(pdfPath), path: pdfPath }],
  };

  await transporter.sendMail(mailOptions);
};

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
    if (!fund) {
      fund = new Fund({ totalFund: amount });
    } else {
      fund.totalFund += amount;
    }
    await fund.save();

    const pdfPath = await generateBillPDF(billing, student);
    billing.billFileName = path.basename(pdfPath);
    await billing.save();

    await sendBillEmail(email, pdfPath);

    res.status(201).json({ message: 'Billing successful, email sent 🎉' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Billing failed' });
  }
};

exports.getPaymentStats = async (req, res) => {
  try {
    const totalOnline = await Billing.countDocuments({ paymentMode: 'Online' });
    const totalCash = await Billing.countDocuments({ paymentMode: 'Cash' });
    const totalFoodCoupons = await Billing.countDocuments({ foodCoupon: true });
    res.json({ totalOnline, totalCash, totalFoodCoupons });
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    res.status(500).json({ message: "Failed to fetch payment stats" });
  }
};

exports.getAllBills = async (req, res) => {
  try {
    const bills = await Billing.find().populate('student', 'name universityRollNo').sort({ paymentDate: -1 });
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
    console.error("Error fetching all bills:", error);
    res.status(500).json({ message: "Failed to fetch bills" });
  }
};
