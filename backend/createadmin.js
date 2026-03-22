/**
 * Standalone script to seed the default admin (optional).
 * The server also auto-seeds on startup; run this only for one-off use.
 */
require("dotenv").config();
const { seedAdmin, adminData } = require("./seedadmin");

seedAdmin()
  .then(() => {
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Password: ${adminData.password}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
