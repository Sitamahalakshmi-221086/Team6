const Company = require('../models/Company');
const bcrypt = require('bcryptjs');

const companySignup = async (req, res) => {
  try {
    const { companyName, email, password, contactPerson, phone, industry, companySize, website, address, hiringRoles, description } = req.body;

    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newCompany = await Company.create({
      companyName, email, password: hashedPassword, contactPerson, phone, industry,
      companySize, website, address,
      hiringRoles: Array.isArray(hiringRoles) ? hiringRoles : (hiringRoles ? JSON.parse(hiringRoles) : []),
      description
    });

    res.status(201).json({ success: true, message: 'Company registered successfully', companyId: newCompany._id });
  } catch (error) {
    console.error('Company Signup Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

const companyLogin = async (req, res) => {
  try {
    const { email, password, companyName } = req.body;

    const company = await Company.findOne({ email }).select('+password');
    if (!company) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (company.companyName.trim().toLowerCase() !== companyName.trim().toLowerCase()) {
      return res.status(401).json({ success: false, message: 'Company name does not match our records' });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      company: { id: company._id, companyName: company.companyName, email: company.email }
    });
  } catch (error) {
    console.error('Company Login Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { companySignup, companyLogin };
