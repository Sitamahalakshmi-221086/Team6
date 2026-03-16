const Company = require('../models/Company');
const bcrypt = require('bcryptjs');

const companySignup = async (req, res) => {
  try {
    const {
      companyName,
      email,
      password,
      contactPerson,
      phone,
      industry,
      companySize,
      website,
      headquarters,
      address,
      hiringRoles,
      description
    } = req.body;

    // Check if company already exists
    const normalizedEmail = email.trim().toLowerCase();
    const existingCompany = await Company.findOne({ email: normalizedEmail });
    if (existingCompany) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare company data
    const companyData = {
      companyName,
      email: normalizedEmail,
      password: hashedPassword,
      contactPerson,
      phone,
      industry,
      companySize,
      website,
      headquarters,
      address,
      hiringRoles: Array.isArray(hiringRoles) ? hiringRoles : (hiringRoles ? JSON.parse(hiringRoles) : []),
      description,
      isVerified: true
    };

    const newCompany = await Company.create(companyData);

    res.status(201).json({
      success: true,
      message: 'Company registered successfully',
      companyId: newCompany._id
    });
  } catch (error) {
    console.error('Company Signup Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

const companyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Find company and include password
    const company = await Company.findOne({ email: normalizedEmail }).select('+password');

    if (!company) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 2. Allow login for verified companies OR legacy users (no isVerified field set)
    if (company.isVerified === false) {
      return res.status(403).json({ success: false, message: 'Account not verified. Please complete the signup process.' });
    }

    // 3. Check password (bcrypt match first)
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, company.password);
    } catch (bcryptErr) {
      isMatch = false;
    }

    // 3b. Fallback: plain-text comparison for legacy accounts (pre-bcrypt migration)
    if (!isMatch && company.password === password) {
      const salt = await bcrypt.genSalt(10);
      company.password = await bcrypt.hash(password, salt);
      await company.save();
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 4. Success
    res.status(200).json({
      success: true,
      message: 'Login successful',
      company: {
        id: company._id,
        companyName: company.companyName,
        email: company.email,
        contactPerson: company.contactPerson,
        phone: company.phone,
        industry: company.industry,
        companySize: company.companySize,
        website: company.website,
        address: company.address,
        hiringRoles: company.hiringRoles,
        description: company.description
      }
    });

  } catch (error) {
    console.error('Company Login Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  companySignup,
  companyLogin
};
