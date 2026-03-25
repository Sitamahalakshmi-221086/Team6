const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'Backend', '.env') });

const TPO = require('./Backend/models/TPO');
const Student = require('./Backend/models/Student');
const Company = require('./Backend/models/Company');

async function findUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const tpo = await TPO.findOne();
    const student = await Student.findOne();
    const company = await Company.findOne();
    
    console.log('TPO:', tpo ? tpo.email : 'None');
    console.log('Student:', student ? student.email : 'None');
    console.log('Company:', company ? company.email : 'None');
    
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

findUsers();
