import mongoose from 'mongoose';

let isConnected = false;


const dbConnect = async () => {
    if (isConnected) return;

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'chatgpt-clone',
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        isConnected = true;
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        throw error;
    }
};

export default dbConnect;


