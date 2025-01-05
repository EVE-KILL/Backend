import mongoose from 'mongoose';

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
    throw new Error('No MongoDB URI provided');
}

async function initMongooseConnection() {
    try {
        await mongoose.connect(mongoUri);
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
        process.exit(1);
    }
}

initMongooseConnection();

export { initMongooseConnection };
