import { MongoClient } from 'mongodb';
import 'dotenv/config';

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
  await db.collection('products').createIndex({ brand: 1 });
  await db.collection('products').createIndex(
    { id: 1 },
    { unique: true, sparse: true }
  );

  console.log('✅ Indexes created');
} finally {
  await client.close();
}