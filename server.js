// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static folder for screenshots or uploads
app.use('/public', express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/billings', require('./routes/billing.routes'));
app.use('/api/fund', require('./routes/fund.routes'));
app.use('/api/users', require('./routes/user.routes'));

app.use('/bills', express.static(path.join(__dirname, 'public', 'bills')));



// Root Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
