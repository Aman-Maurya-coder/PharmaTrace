import mongoose from "mongoose";

let connectionPromise;

export async function connectDB() {
  if (connectionPromise) {
    return connectionPromise;
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  if (!uri || !dbName) {
    throw new Error("Missing MongoDB environment variables");
  }

  mongoose.connection.on("connected", () => {
    // eslint-disable-next-line no-console
    console.log("MongoDB connected");
  });

  mongoose.connection.on("disconnected", () => {
    // eslint-disable-next-line no-console
    console.log("MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    // eslint-disable-next-line no-console
    console.log("MongoDB reconnected");
  });

  mongoose.connection.on("error", (err) => {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection error", err);
  });

  connectionPromise = mongoose.connect(uri, {
    dbName,
    autoIndex: true
  });

  try {
    await connectionPromise;
  } catch (err) {
    connectionPromise = undefined;
    throw err;
  }

  return connectionPromise;
}
