
import mongoose from "mongoose";

const geoLocationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
    },

    coordinates: {
      type: [Number],
      validate: {
        validator(value) {
          if (!value) return true;

          return (
            value.length === 2 &&
            value[0] >= -180 &&
            value[0] <= 180 &&
            value[1] >= -90 &&
            value[1] <= 90
          );
        },
        message:
          "Coordinates must be in [longitude, latitude] format.",
      },
    },

    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },

    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },

    accuracy: {
      type: Number,
      min: 0,
    },

    source: {
      type: String,
      enum: ["GPS", "Manual", "Network", "Unknown"],
      default: "Unknown",
    },

    address: {
      type: String,
      trim: true,
    },

    capturedAt: {
      type: Date,
    },

    verificationStatus: {
      type: String,
      enum: ["Not Provided", "Pending", "Verified", "Rejected"],
      default: "Not Provided",
    },

    verificationNote: {
      type: String,
      trim: true,
      default: "",
    },

    isWithinClaimedArea: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);

const confirmationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    confirmedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const alertSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    brandName: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    barcode: {
      type: String,
      trim: true,
      default: "",
    },

    batchNumber: {
      type: String,
      trim: true,
      default: "",
    },

    shopName: {
      type: String,
      trim: true,
      default: "",
    },

    purchaseLocation: {
      type: String,
      required: [true, "Purchase location is required"],
      trim: true,
    },

    geoLocation: {
      type: geoLocationSchema,
      default: undefined,
    },

    suspiciousReason: {
      type: String,
      required: [true, "Suspicious reason is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    evidenceImages: {
      type: [String],
      default: [],
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter information is required"],
    },

    confirmedBy: {
      type: [confirmationSchema],
      default: [],
    },

    comments: {
      type: [commentSchema],
      default: [],
    },

    adminNote: {
      type: String,
      trim: true,
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ geoLocation: "2dsphere" });
alertSchema.index({ status: 1, createdAt: -1 });
alertSchema.index({ reportedBy: 1, createdAt: -1 });

const Alert = mongoose.model("Alert", alertSchema);

export default Alert;