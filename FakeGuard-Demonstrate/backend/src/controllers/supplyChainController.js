import SupplyChain from "../models/SupplyChain.js";

const getLoggedInUserId = (req) => {
  return req.user?._id || req.user?.id;
};

const generateTraceId = (barcode, batchNumber) => {
  const cleanBarcode = String(barcode || "UNKNOWN").replace(/\s+/g, "").toUpperCase();
  const cleanBatch = String(batchNumber || "BATCH").replace(/\s+/g, "").toUpperCase();
  const timestamp = Date.now().toString().slice(-6);

  return `TRC-${cleanBarcode}-${cleanBatch}-${timestamp}`;
};

const buildEventGeoLocation = (body) => {
  const latitude =
  body.latitude ?? body.geoLocation?.latitude;

const longitude =
  body.longitude ?? body.geoLocation?.longitude;

const accuracy =
  body.accuracy ?? body.geoLocation?.accuracy;

  const hasValidCoordinates =
    latitude !== undefined &&
    longitude !== undefined &&
    !Number.isNaN(Number(latitude)) &&
    !Number.isNaN(Number(longitude));

  if (!hasValidCoordinates) {
    return undefined;
  }

  return {
    type: "Point",
    coordinates: [Number(longitude), Number(latitude)],
    latitude: Number(latitude),
    longitude: Number(longitude),
    accuracy:
  accuracy !== undefined && accuracy !== null
    ? Number(accuracy)
    : undefined,
  };
};

export const createSupplyChainRecord = async (req, res) => {
  try {
    const userId = getLoggedInUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const {
      productName,
      brandName,
      category,
      barcode,
      batchNumber,
      manufacturerName,
      manufactureDate,
      expiryDate,
      currentOwner,
      currentLocation,
      authenticityStatus,
      initialStage,
      actorType,
      actorName,
      locationName,
      documentRef,
      note,
      latitude,
      longitude,
      accuracy,
    } = req.body;

    const traceId = generateTraceId(barcode, batchNumber);

    const initialEvent = {
      stage: initialStage || "Manufactured",
      actorType: actorType || "Manufacturer",
      actorName: actorName || manufacturerName,
      locationName: locationName || currentLocation || "Manufacturer Facility",
      geoLocation: buildEventGeoLocation({ latitude, longitude, accuracy }),
      documentRef,
      note: note || "Initial supply chain record created.",
      verificationStatus: "Pending",
    };

    const supplyChainRecord = await SupplyChain.create({
      traceId,
      productName,
      brandName,
      category,
      barcode,
      batchNumber,
      manufacturerName,
      manufactureDate,
      expiryDate,
      currentStage: initialEvent.stage,
      currentOwner: currentOwner || actorName || manufacturerName,
      currentLocation: currentLocation || locationName || "Manufacturer Facility",
      authenticityStatus: authenticityStatus || "Pending",
      traceEvents: [initialEvent],
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      message: "Supply chain traceability record created successfully",
      trace: supplyChainRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create supply chain record",
      error: error.message,
    });
  }
};

export const addSupplyChainEvent = async (req, res) => {
  try {
    const userId = getLoggedInUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const { traceId } = req.params;

    const {
      stage,
      actorType,
      actorName,
      locationName,
      documentRef,
      note,
      verificationStatus,
      latitude,
      longitude,
      accuracy,
    } = req.body;

    const supplyChainRecord = await SupplyChain.findOne({ traceId: traceId.toUpperCase() });

    if (!supplyChainRecord) {
      return res.status(404).json({
        success: false,
        message: "Supply chain trace record not found",
      });
    }
const isRecordOwner =
  supplyChainRecord.createdBy.toString() === userId.toString();

const isAdmin = req.user?.role === "admin";

if (!isRecordOwner && !isAdmin) {
  return res.status(403).json({
    success: false,
    message:
      "You are not allowed to update this supply chain record",
  });
}
    const newEvent = {
      stage,
      actorType,
      actorName,
      locationName,
      geoLocation: buildEventGeoLocation({ latitude, longitude, accuracy }),
      documentRef,
      note,
      verificationStatus: verificationStatus || "Pending",
      verifiedBy: verificationStatus === "Verified" ? userId : undefined,
    };

    supplyChainRecord.traceEvents.push(newEvent);
    supplyChainRecord.currentStage = stage;
    supplyChainRecord.currentOwner = actorName;
    supplyChainRecord.currentLocation = locationName;

    if (stage === "Flagged") {
      supplyChainRecord.authenticityStatus = "Suspicious";
    }

    await supplyChainRecord.save();

    res.status(200).json({
      success: true,
      message: "Supply chain event added successfully",
      trace: supplyChainRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add supply chain event",
      error: error.message,
    });
  }
};

export const getSupplyChainByTraceId = async (req, res) => {
  try {
    const { traceId } = req.params;

    const supplyChainRecord = await SupplyChain.findOne({
      traceId: traceId.toUpperCase(),
    })
      .populate("createdBy", "fullName email")
      .populate("traceEvents.verifiedBy", "fullName email");

    if (!supplyChainRecord) {
      return res.status(404).json({
        success: false,
        message: "Supply chain trace record not found",
      });
    }

    res.status(200).json({
      success: true,
      trace: supplyChainRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch supply chain record",
      error: error.message,
    });
  }
};

export const verifyProductTrace = async (req, res) => {
  try {
    const { barcode, batchNumber } = req.query;

    if (!barcode || !batchNumber) {
      return res.status(400).json({
        success: false,
        message: "Barcode and batch number are required",
      });
    }

    const supplyChainRecord = await SupplyChain.findOne({
      barcode,
      batchNumber,
    }).select(
      "traceId productName brandName category barcode batchNumber manufacturerName manufactureDate expiryDate currentStage currentOwner currentLocation authenticityStatus traceEvents createdAt updatedAt"
    );

    if (!supplyChainRecord) {
      return res.status(404).json({
        success: false,
        message: "No verified supply chain record found for this product",
        authenticityStatus: "Unknown",
      });
    }

    res.status(200).json({
      success: true,
      message: "Supply chain record found",
      authenticityStatus: supplyChainRecord.authenticityStatus,
      trace: supplyChainRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify product trace",
      error: error.message,
    });
  }
};

export const getMySupplyChainRecords = async (req, res) => {
  try {
    const userId = getLoggedInUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const records = await SupplyChain.find({ createdBy: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      total: records.length,
      traces: records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch your supply chain records",
      error: error.message,
    });
  }
};