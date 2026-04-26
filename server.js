const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tqc_enquiries';

// ── Middleware ──
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Schema ──
const enquirySchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  email:           { type: String, required: true, trim: true, lowercase: true },
  phone:           { type: String, required: true, trim: true },
  subject:         { type: String, required: true, trim: true },
  message:         { type: String, required: true, trim: true },
  company:         { type: String, default: '', trim: true },
  country:         { type: String, default: '', trim: true },
  address:         { type: String, default: '', trim: true },
  businessDetails: { type: String, default: '', trim: true },
  fax:             { type: String, default: '', trim: true },
  createdAt:       { type: Date, default: Date.now }
});

const Enquiry = mongoose.model('Enquiry', enquirySchema);

// ── POST /api/contact ──
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message, company, country, address, businessDetails, fax } = req.body;
    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ error: 'Required fields missing: name, email, phone, subject, message' });
    }
    const enquiry = new Enquiry({ name, email, phone, subject, message, company, country, address, businessDetails, fax });
    await enquiry.save();
    res.status(201).json({ success: true, id: enquiry._id });
  } catch (err) {
    console.error('POST /api/contact:', err.message);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── GET /api/contact ──
app.get('/api/contact', async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (err) {
    console.error('GET /api/contact:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── DELETE /api/contact/:id ──
app.delete('/api/contact/:id', async (req, res) => {
  try {
    const result = await Enquiry.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Enquiry not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/contact/:id:', err.message);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── Static fallback ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Connect & Start ──
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected:', MONGO_URI);
    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════');
      console.log('  🚀 The Quality Catalyst — Server Running');
      console.log('═══════════════════════════════════════════');
      console.log(`  Website:  http://localhost:${PORT}`);
      console.log(`  Admin:    http://localhost:${PORT}/admin-login.html`);
      console.log('  Creds:    admin / admin123');
      console.log('═══════════════════════════════════════════');
      console.log('');
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   Make sure MongoDB is running: mongod');
    process.exit(1);
  });
