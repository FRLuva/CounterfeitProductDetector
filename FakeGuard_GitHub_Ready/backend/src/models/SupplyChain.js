import mongoose from "mongoose";

const SUPPLY_CHAIN_STAGES = [
  "Manufactured",
  "Quality Checked",
  "Packaged",
  "Shipped",
  "Distributor Received",
  "Wholesaler Received",
  "Retailer Received",
  "Sold To Customer",
  "Returned",
  "Flagged",
];

const ACTOR_TYPES = [
  "Manufacturer",
  "Distributor",
  "Wholesaler",
  "Retailer",
  "Customer",
  "Admin",
  "System",
];

const eventGeoLocationSchema = new mongoose.Schema(
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
            Number.isFinite(value[0]) &&
            Number.isFinite(value[1]) &&
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
      min: [-90, "Latitude cannot be less than -90"],
      max: [90, "Latitude cannot be greater than 90"],
    },

    longitude: {
      type: Number,
      min: [-180, "Longitude cannot be less than -180"],
      max: [180, "Longitude cannot be greater than 180"],
    },

    accuracy: {
      type: Number,
      min: [0, "Accuracy cannot be negative"],
    },
  },
  {
    _id: false,
  }
);

const supplyChainEventSchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      enum: SUPPLY_CHAIN_STAGES,
      required: [true, "Supply chain stage is required"],
    },

    actorType: {
      type: String,
      enum: ACTOR_TYPES,
      required: [true, "Actor type is required"],
    },

    actorName: {
      type: String,
      required: [true, "Actor name is required"],
      trim: true,
    },

    locationName: {
      type: String,
      required: [true, "Location name is required"],
      trim: true,
    },

    geoLocation: {
      type: eventGeoLocationSchema,
      default: undefined,
    },

    eventTime: {
      type: Date,
      default: Date.now,
    },

    documentRef: {
      type: String,
      trim: true,
      default: "",
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },

    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected", "Suspicious"],
      default: "Pending",
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    _id: true,
  }
);

const supplyChainSchema = new mongoose.Schema(
  {
    traceId: {
      type: String,
      required: [true, "Trace ID is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

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
      required: [true, "Barcode is required"],
      trim: true,
      index: true,
    },

    batchNumber: {
      type: String,
      required: [true, "Batch number is required"],
      trim: true,
      index: true,
    },

    manufacturerName: {
      type: String,
      required: [true, "Manufacturer name is required"],
      trim: true,
    },

    manufactureDate: {
      type: Date,
    },

    expiryDate: {
      type: Date,
      validate: {
        validator(value) {
          if (!value || !this.manufactureDate) return true;

          return value > this.manufactureDate;
        },
        message:
          "Expiry date must be later than manufacture date.",
      },
    },

    currentStage: {
      type: String,
      enum: SUPPLY_CHAIN_STAGES,
      default: "Manufactured",
    },

    currentOwner: {
      type: String,
      trim: true,
      default: "",
    },

    currentLocation: {
      type: String,
      trim: true,
      default: "",
    },

    authenticityStatus: {
      type: String,
      enum: ["Pending", "Authentic", "Suspicious", "Fake", "Expired"],
      default: "Pending",
    },

    traceEvents: {
      type: [supplyChainEventSchema],
      default: [],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator information is required"],
    },
  },
  {
    timestamps: true,
  }
);

supplyChainSchema.index({
  barcode: 1,
  batchNumber: 1,
});

supplyChainSchema.index({
  "traceEvents.geoLocation": "2dsphere",
});

const SupplyChain = mongoose.model(
  "SupplyChain",
  supplyChainSchema
);

export default SupplyChain;