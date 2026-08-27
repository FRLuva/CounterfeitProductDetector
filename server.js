import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import supplyChainRoutes from "./routes/supplyChainRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

connectDB();

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: {
    success: false,
    message: "Too many login/register requests. Please try again later."
  }
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Fake Product Detection API is running"
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/supply-chain", supplyChainRoutes);

app.use(notFound);
app.use(errorHandler);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
