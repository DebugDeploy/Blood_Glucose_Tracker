import '../config.js';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail, initializeStore, saveReading } from './store.js';
import { pool } from './pool.js';
import { localDateString } from '../validation.js';

const name = process.env.SEED_USER_NAME || 'Demo User';
const email = (process.env.SEED_USER_EMAIL || 'demo@example.com').toLowerCase();
const password = process.env.SEED_USER_PASSWORD || 'DemoPassword123!';

try {
  await initializeStore();

  // Create the demo account only if it does not exist yet.
  let user = await findUserByEmail(email);
  const isNewUser = !user;

  if (isNewUser) {
    const passwordHash = await bcrypt.hash(password, 12);
    user = await createUser({ name, email, passwordHash });
  }

  // Add four sample readings for each of the past seven days.
  for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const readings = [
      ['Morning (fasting)', 92 + daysAgo],
      ['After breakfast', 128 + daysAgo * 2],
      ['After lunch', 139 + daysAgo],
      ['After dinner', 121 + daysAgo]
    ];

    for (const [slot, value] of readings) {
      try {
        await saveReading(user.id, {
          date: localDateString(date),
          slot,
          value
        });
      } catch (error) {
        // On later runs, keep any sample reading that is already present.
        if (!error.message.includes('already have')) throw error;
      }
    }
  }

  if (isNewUser) {
    console.log(`Demo account created: ${email} / ${password}`);
  } else {
    console.log(`Demo account already exists: ${email}`);
  }
  console.log('Sample readings are ready for the past seven days.');
} finally {
  await pool.end();
}
