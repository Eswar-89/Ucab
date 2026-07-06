import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_FILE = path.resolve('./database.json');

// Initialize database file if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    users: [],
    drivers: [],
    bookings: [],
    payments: [],
    tickets: []
  }, null, 2));
}

// On every server start, reset ALL drivers to available so seeded captains are never permanently busy
try {
  const _startupRaw = fs.readFileSync(DB_FILE, 'utf8');
  const _startupDb = JSON.parse(_startupRaw);
  let _startupModified = false;
  _startupDb.drivers.forEach(d => {
    if (!d.isAvailable) {
      d.isAvailable = true;
      _startupModified = true;
    }
  });
  if (_startupModified) {
    fs.writeFileSync(DB_FILE, JSON.stringify(_startupDb, null, 2), 'utf8');
    console.log('[UCab] Reset all drivers to available on startup.');
  }
} catch (_e) { /* ignore if file not ready yet */ }

const DEFAULT_CAPTAINS = [
  { name: "Amit Sharma", email: "amit.sharma@ucab.in", phone: "+91 98765 00001", vehicleType: "bike", vehicleNumber: "DL-01-CA-1122", vehicleModel: "Hero Splendor", rating: 4.8 },
  { name: "Karan Patel", email: "karan.patel@ucab.in", phone: "+91 98765 00002", vehicleType: "auto", vehicleNumber: "GJ-01-AB-3344", vehicleModel: "Bajaj RE Auto", rating: 4.6 },
  { name: "Rajesh Kumar", email: "rajesh.kumar@ucab.in", phone: "+91 98765 00003", vehicleType: "car", vehicleNumber: "KA-03-ME-7788", vehicleModel: "Maruti Suzuki Swift", rating: 4.9 },
  { name: "Suresh Pillai", email: "suresh.pillai@ucab.in", phone: "+91 98765 00004", vehicleType: "suv", vehicleNumber: "TN-07-BY-5566", vehicleModel: "Toyota Innova Crysta", rating: 4.7 },
  { name: "Vikram Singh", email: "vikram.singh@ucab.in", phone: "+91 98765 00005", vehicleType: "bike", vehicleNumber: "RJ-14-CD-9900", vehicleModel: "Honda Activa", rating: 4.5 },
  { name: "Anil Reddy", email: "anil.reddy@ucab.in", phone: "+91 98765 00006", vehicleType: "auto", vehicleNumber: "AP-02-TZ-1234", vehicleModel: "TVS King Auto", rating: 4.8 },
  { name: "Rohan Deshmukh", email: "rohan.deshmukh@ucab.in", phone: "+91 98765 00007", vehicleType: "car", vehicleNumber: "MH-12-PQ-4567", vehicleModel: "Hyundai i20", rating: 4.6 },
  { name: "Pranav Nair", email: "pranav.nair@ucab.in", phone: "+91 98765 00008", vehicleType: "suv", vehicleNumber: "KL-07-XY-7890", vehicleModel: "Mahindra XUV500", rating: 4.9 },
  { name: "Sanjay Dutt", email: "sanjay.dutt@ucab.in", phone: "+91 98765 00009", vehicleType: "bike", vehicleNumber: "MH-01-AA-0009", vehicleModel: "Royal Enfield Classic 350", rating: 4.4 },
  { name: "Vijay Mallya", email: "vijay.mallya@ucab.in", phone: "+91 98765 00010", vehicleType: "car", vehicleNumber: "KA-04-BB-9999", vehicleModel: "Honda City", rating: 4.8 }
];

// Helper to generate a random 24-character hex ID (similar to ObjectId)
function generateId() {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// Utility to read DB
function readDb() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(data);
    
    // Seed default captains if missing
    let modified = false;
    DEFAULT_CAPTAINS.forEach(cap => {
      const userExists = db.users.some(u => u.email === cap.email);
      if (!userExists) {
        const userId = generateId();
        const driverId = generateId();
        
        db.users.push({
          _id: userId,
          name: cap.name,
          email: cap.email,
          phone: cap.phone,
          password: bcrypt.hashSync("ucabdriver123", 10),
          role: "driver",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        db.drivers.push({
          _id: driverId,
          user: userId,
          vehicleType: cap.vehicleType,
          vehicleNumber: cap.vehicleNumber,
          vehicleModel: cap.vehicleModel,
          rating: cap.rating,
          totalRatingSum: cap.rating * 10,
          completedRides: 10,
          isAvailable: true,
          currentLocation: { 
            lat: 12.9779 + (Math.random() - 0.5) * 0.05, 
            lng: 77.5696 + (Math.random() - 0.5) * 0.05 
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    }
    
    return db;
  } catch (err) {
    console.error('Error reading database file:', err);
    return { users: [], drivers: [], bookings: [], payments: [], tickets: [] };
  }
}

// Utility to write DB
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// User model wrapper
export const User = {
  async findOne({ email }) {
    const db = readDb();
    const user = db.users.find(u => u.email === email);
    if (!user) return null;
    
    // Add comparePassword helper
    return {
      ...user,
      comparePassword: async function (plain) {
        return bcrypt.compare(plain, user.password);
      }
    };
  },

  async findById(id) {
    const db = readDb();
    const user = db.users.find(u => String(u._id) === String(id));
    return user || null;
  },

  async create(userData) {
    const db = readDb();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = {
      _id: generateId(),
      ...userData,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.push(newUser);
    writeDb(db);
    return {
      ...newUser,
      comparePassword: async function (plain) {
        return bcrypt.compare(plain, newUser.password);
      }
    };
  },

  async findOneAndUpdate(query, update, options = {}) {
    const db = readDb();
    const index = db.users.findIndex(u => u._id === query._id);
    if (index === -1) return null;
    db.users[index] = { ...db.users[index], ...update, updatedAt: new Date().toISOString() };
    writeDb(db);
    return db.users[index];
  }
};

// Driver model wrapper
export const Driver = {
  async findOne(query) {
    const db = readDb();
    let driver;
    if (query.user) {
      driver = db.drivers.find(d => String(d.user) === String(query.user));
    } else if (query.vehicleType) {
      driver = db.drivers.find(d => d.vehicleType === query.vehicleType && d.isAvailable === query.isAvailable);
    } else if (query.isAvailable !== undefined) {
      driver = db.drivers.find(d => d.isAvailable === query.isAvailable);
    }
    if (!driver) return null;
    
    // Populate user details
    const userData = db.users.find(u => String(u._id) === String(driver.user));
    return {
      ...driver,
      user: userData || driver.user
    };
  },

  async findById(id) {
    const db = readDb();
    const driver = db.drivers.find(d => String(d._id) === String(id));
    if (!driver) return null;
    const userData = db.users.find(u => String(u._id) === String(driver.user));
    return {
      ...driver,
      user: userData || driver.user
    };
  },

  async find(query = {}) {
    const db = readDb();
    let results = db.drivers;
    
    if (query.vehicleType) {
      results = results.filter(d => d.vehicleType === query.vehicleType);
    }
    
    // Populate user details
    return results.map(d => {
      const userData = db.users.find(u => String(u._id) === String(d.user));
      return {
        ...d,
        user: userData || d.user
      };
    });
  },

  async create(driverData) {
    const db = readDb();
    const newDriver = {
      _id: generateId(),
      ...driverData,
      rating: 0,
      totalRatingSum: 0,
      completedRides: 0,
      isAvailable: true,
      currentLocation: { lat: 0, lng: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.drivers.push(newDriver);
    writeDb(db);
    return newDriver;
  },

  async findOneAndUpdate(query, update, options = {}) {
    const db = readDb();
    let index = db.drivers.findIndex(d => String(d.user) === String(query.user));
    
    if (index === -1 && options.upsert) {
      const newDriver = {
        _id: generateId(),
        user: query.user,
        rating: 0,
        totalRatingSum: 0,
        completedRides: 0,
        isAvailable: true,
        currentLocation: { lat: 0, lng: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.drivers.push(newDriver);
      index = db.drivers.length - 1;
    }
    
    if (index === -1) return null;
    
    db.drivers[index] = { 
      ...db.drivers[index], 
      ...update, 
      updatedAt: new Date().toISOString() 
    };
    writeDb(db);
    return db.drivers[index];
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const db = readDb();
    const index = db.drivers.findIndex(d => String(d._id) === String(id));
    if (index === -1) return null;
    
    // Handle nested increments or sets
    const current = db.drivers[index];
    let updated = { ...current };
    
    for (const key in update) {
      if (key === '$inc') {
        for (const incKey in update.$inc) {
          updated[incKey] = (current[incKey] || 0) + update.$inc[incKey];
        }
      } else {
        updated[key] = update[key];
      }
    }
    
    updated.updatedAt = new Date().toISOString();
    db.drivers[index] = updated;
    writeDb(db);
    return updated;
  }
};

// Booking model wrapper
export const Booking = {
  async create(bookingData) {
    const db = readDb();
    const newBooking = {
      _id: generateId(),
      ...bookingData,
      status: bookingData.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.bookings.push(newBooking);
    writeDb(db);
    return newBooking;
  },

  async find(query = {}) {
    const db = readDb();
    let results = db.bookings;

    if (query.rider) {
      results = results.filter(b => String(b.rider) === String(query.rider));
    }
    if (query.vehicleType) {
      results = results.filter(b => b.vehicleType === query.vehicleType);
    }
    if (query.status) {
      results = results.filter(b => b.status === query.status);
    }

    // Populate rider and driver
    return results.map(b => {
      const riderUser = db.users.find(u => String(u._id) === String(b.rider));
      let driverPopulated = null;
      if (b.driver) {
        const drv = db.drivers.find(d => String(d._id) === String(b.driver));
        if (drv) {
          const drvUser = db.users.find(u => String(u._id) === String(drv.user));
          driverPopulated = { ...drv, user: drvUser || drv.user };
        }
      }
      return {
        ...b,
        rider: riderUser || b.rider,
        driver: driverPopulated || b.driver
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async findById(id) {
    const db = readDb();
    const b = db.bookings.find(booking => String(booking._id) === String(id));
    if (!b) return null;

    const riderUser = db.users.find(u => String(u._id) === String(b.rider));
    let driverPopulated = null;
    if (b.driver) {
      const drv = db.drivers.find(d => String(d._id) === String(b.driver));
      if (drv) {
        const drvUser = db.users.find(u => String(u._id) === String(drv.user));
        driverPopulated = { ...drv, user: drvUser || drv.user };
      }
    }

    return {
      ...b,
      rider: riderUser || b.rider,
      driver: driverPopulated || b.driver
    };
  },

  async findByIdAndUpdate(id, update, options = {}) {
    const db = readDb();
    const index = db.bookings.findIndex(b => String(b._id) === String(id));
    if (index === -1) return null;
    
    db.bookings[index] = { 
      ...db.bookings[index], 
      ...update, 
      updatedAt: new Date().toISOString() 
    };
    writeDb(db);
    return db.bookings[index];
  }
};

// Payment model wrapper
export const Payment = {
  async create(paymentData) {
    const db = readDb();
    const newPayment = {
      _id: generateId(),
      ...paymentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.payments.push(newPayment);
    writeDb(db);
    return newPayment;
  }
};

// SupportTicket model wrapper
export const SupportTicket = {
  async create(ticketData) {
    const db = readDb();
    const newTicket = {
      _id: generateId(),
      ...ticketData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.tickets.push(newTicket);
    writeDb(db);
    return newTicket;
  }
};

export default { User, Driver, Booking, Payment, SupportTicket };
