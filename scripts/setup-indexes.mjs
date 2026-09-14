import { MongoClient } from 'mongodb';
import 'dotenv/config'; // or load your .env manually

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'maxvolt');

  await db.collection('users').createIndex({ uid: 1 }, { unique: true });
  await db.collection('users').createIndex({ email: 1 });
  await db.collection('orders').createIndex({ uid: 1, createdAt: -1 });
  await db.collection('orders').createIndex({ razorpayOrderId: 1 });
  await db.collection('quotes').createIndex({ status: 1, createdAt: -1 });
  await db.collection('products').createIndex({ category: 1, active: 1 });

  console.log('✅ Indexes created');
} finally {
  await client.close();
}