import mongoose from 'mongoose';

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.log('No MONGO_URI found. Using fallback local JSON database.');
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    console.log('Ensure MongoDB is running locally or set MONGO_URI in .env');
  }
};

export default connectDB;
