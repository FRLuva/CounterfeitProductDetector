import express from "express";

import {
  createAlert,
  getApprovedAlerts,
  getMyAlerts,
  getSingleAlert,
  confirmAlert,
  addComment,
  updateAlertStatus,
  getPendingAlerts,
} from "../controllers/alertController.js";

import {
  protect,
  adminOnly,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Submit fake product alert
router.post("/", protect, createAlert);

// Public approved community alerts
router.get("/", getApprovedAlerts);

// Logged-in user's own submitted alerts
router.get("/my-alerts", protect, getMyAlerts);

// Admin: pending alert review list
router.get("/pending", protect, adminOnly, getPendingAlerts);

// Single alert details
router.get("/:id", getSingleAlert);

// User confirms same fake product issue
router.post("/:id/confirm", protect, confirmAlert);

// User comments on alert
router.post("/:id/comment", protect, addComment);

// Admin approve/reject alert
router.patch("/:id/status", protect, adminOnly, updateAlertStatus);

export default router;