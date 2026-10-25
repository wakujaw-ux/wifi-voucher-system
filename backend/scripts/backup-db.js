require("dotenv").config();
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// Unda folder la backups kama halipo
const backupDir = path.join(__dirname, "../backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const date = new Date().toISOString().replace(/:/g, "-").split(".")[0];
const filename = `backup-${date}.sql`;
const filepath = path.join(backupDir, filename);

// Tumia pg_dump kupakua database
// Kumbuka: badilisha 'postgres' na password yako ya database
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;
const dbHost = process.env.DB_HOST;

const command = `pg_dump -U ${dbUser} -h ${dbHost} -F c -b -v -f "${filepath}" ${dbName}`;

// Weka password kwenye environment ya command
const env = { ...process.env, PGPASSWORD: dbPass };

console.log("⏳ Inaanza ku-backup database...");

exec(command, { env }, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Backup imeshindwa: ${error.message}`);
    return;
  }
  console.log(`✅ Backup imefanikiwa! Faili lipo hapa: ${filepath}`);
});
