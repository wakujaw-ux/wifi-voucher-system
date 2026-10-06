require('dotenv').config();
const hotspotService = require('../src/services/mikrotik/hotspot.service');

(async () => {
  console.log('\n=== Hotspot Users ===');
  const users = await hotspotService.getAllHotspotUsers();
  console.log(JSON.stringify(users, null, 2));
  console.log(`Total: ${users.length}`);
})();