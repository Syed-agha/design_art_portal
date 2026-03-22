const db = require("./config/db");
const bcrypt = require("bcryptjs");

const adminData = {
  name: "Super Admin",
  email: "admin@designarts.com",
  password: "admin123"
};

/**
 * Seeds the default admin user if it does not exist.
 * Safe to call on every startup.
 * @returns {Promise<void>}
 */
function seedAdmin() {
  return new Promise((resolve, reject) => {
    const checkQuery = "SELECT * FROM admins WHERE email = ? LIMIT 1";
    db.query(checkQuery, [adminData.email], (err, results) => {
      if (err) {
        console.error("❌ Seed: Error checking admin:", err.message);
        return reject(err);
      }

      if (results.length > 0) {
        console.log("✅ Seed: Admin user already exists");
        return resolve();
      }

      bcrypt
        .hash(adminData.password, 10)
        .then((passwordHash) => {
          const insertQuery =
            "INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)";
          db.query(
            insertQuery,
            [adminData.name, adminData.email, passwordHash],
            (err) => {
              if (err) {
                console.error("❌ Seed: Error creating admin:", err.message);
                return reject(err);
              }
              console.log("✅ Seed: Default admin created (admin@designarts.com)");
              resolve();
            }
          );
        })
        .catch(reject);
    });
  });
  
}

module.exports = { seedAdmin, adminData };

// Run seed when executed directly: node seedAdmin.js
if (require.main === module) {
  require("dotenv").config();
  seedAdmin()
    .then(() => {
      console.log(`   Email: ${adminData.email}`);
      console.log(`   Password: ${adminData.password}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Seed failed:", err.message);
      process.exit(1);
    });
}
