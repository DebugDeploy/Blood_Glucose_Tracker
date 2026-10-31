import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail, initializeStore, saveReading } from './store.js';

await initializeStore();
const name = process.env.SEED_USER_NAME || 'Samarth Demo';
const email = (process.env.SEED_USER_EMAIL || 'demo@example.com').toLowerCase();
const password = process.env.SEED_USER_PASSWORD || 'Password123!';
let user = await findUserByEmail(email);
if (!user) user = await createUser({ name,email,passwordHash:await bcrypt.hash(password,12) });
const today = new Date();
for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
  const day = new Date(today); day.setDate(today.getDate() - daysAgo);
  const date = day.toISOString().slice(0,10);
  const readings = [['Morning (fasting)',92+daysAgo],['After breakfast',128+daysAgo*2],['After lunch',139+daysAgo],['After dinner',121+daysAgo]];
  for (const [slot,value] of readings) {
    try { await saveReading(user.id,{date,slot,value}); }
    catch(error) { if (!error.message.includes('already have')) throw error; }
  }
}
console.log(`Demo account ready: ${email} / ${password}`);
