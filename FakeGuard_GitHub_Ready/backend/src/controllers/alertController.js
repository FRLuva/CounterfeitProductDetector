import Alert from "../models/Alert.js";

const getLoggedInUserId = (req) => {
  return req.user?._id || req.user?.id;
};

const buildGeoLocation = (body) => {
  const latitude =
  body.latitude ?? body.geoLocation?.latitude;

const longitude =
  body.longitude ?? body.geoLocation?.longitude;

const accuracy =
  body.accuracy ?? body.geoLocation?.accuracy;

const source =
  body.geoSource ?? body.geoLocation?.source ?? "Unknown";

const address =
  body.geoAddress ??
  body.geoLocation?.address ??
  body.purchaseLocation;
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
    source,
    address,
    capturedAt: new Date(),
    verificationStatus: "Pending",
    verificationNote: "Geo-location submitted and waiting for verification.",
    isWithinClaimedArea: false,
  };
};

export const createAlert = async (req, res) => {
  try {

    const {
  productName,
  brandName,
  category,
  barcode,
  batchNumber,
  shopName,
  purchaseLocation,
  suspiciousReason,
  description,
  evidenceImages,
  riskLevel,
  geoLocation,
  latitude,
  longitude,
  accuracy,
  geoSource,
  geoAddress,
} = req.body;

    const userId = getLoggedInUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const alert = await Alert.create({
      productName,
      brandName,
      category,
      barcode,
      batchNumber,
      shopName,
      purchaseLocation,
      suspiciousReason,
      description,
      evidenceImages,
      riskLevel,
      geoLocation: buildGeoLocation(req.body),
      reportedBy: userId,
    });

    res.status(201).json({
      success: true,
      message:
        "Fake product alert submitted successfully. It is now under review.",
      alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit fake product alert",
      error: error.message,
    });
  }
};

export const getApprovedAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({ status: "Approved" })
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: alerts.length,
      alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch community alerts",
      error: error.message,
    });
  }
};

export const getMyAlerts = async (req, res) => {
  try {
    const userId = getLoggedInUserId(req);

    const alerts = await Alert.find({ reportedBy: userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      total: alerts.length,
      alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch your submitted alerts",
      error: error.message,
    });
  }
};

export const getSingleAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate("reportedBy", "name email")
      .populate("confirmedBy.user", "name email")
      .populate("comments.user", "name email")
      .populate("reviewedBy", "name email");

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    res.status(200).json({
      success: true,
      alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch alert details",
      error: error.message,
    });
  }
};

export const confirmAlert = async (req, res) => {
  try {
    const userId = getLoggedInUserId(req);

    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    const alreadyConfirmed = alert.confirmedBy.some(
      (item) => item.user.toString() === userId.toString()
    );

    if (alreadyConfirmed) {
      return res.status(400).json({
        success: false,
        message: "You have already confirmed this alert",
      });
    }

    alert.confirmedBy.push({
      user: userId,
    });

    await alert.save();

    res.status(200).json({
      success: true,
      message: "Alert confirmed successfully",
      totalConfirmations: alert.confirmedBy.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to confirm alert",
      error: error.message,
    });
  }
};

export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = getLoggedInUserId(req);

    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    alert.comments.push({
      user: userId,
      text,
    });

    await alert.save();

    res.status(200).json({
      success: true,
      message: "Comment added successfully",
      comments: alert.comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message,
    });
  }
};

export const updateAlertStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const userId = getLoggedInUserId(req);

    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update alert status",
      });
    }

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alert status",
      });
    }

    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    alert.status = status;
    alert.adminNote = adminNote || "";
    alert.reviewedBy = userId;
    alert.reviewedAt = new Date();

    await alert.save();

    res.status(200).json({
      success: true,
      message: "Alert status updated successfully",
      alert,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update alert status",
      error: error.message,
    });
  }
};

export const getPendingAlerts = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can view pending alerts",
      });
    }

    const alerts = await Alert.find({ status: "Pending" })
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: alerts.length,
      alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending alerts",
      error: error.message,
    });
  }
};