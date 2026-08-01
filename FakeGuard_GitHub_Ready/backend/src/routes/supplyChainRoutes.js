import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createSupplyChainRecord,
  addSupplyChainEvent,
  getSupplyChainByTraceId,
  verifyProductTrace,
  getMySupplyChainRecords,
} from "../controllers/supplyChainController.js";

const router = express.Router();

// Create new supply chain trace record//
router.post("/", protect, createSupplyChainRecord);

// Get my created trace records//
router.get("/my-records", protect, getMySupplyChainRecords);

// Public product verification by barcode and batch number//
router.get("/verify", verifyProductTrace);

// Get full trace record by trace ID//
router.get("/:traceId", getSupplyChainByTraceId);

// Add new movement/event to existing trace//
router.post("/:traceId/events", protect, addSupplyChainEvent);

export default router;