import React, { useEffect, useRef, useState } from "react";
import {
  BarcodeFormat,
  BinaryBitmap,
  BrowserMultiFormatReader,
  DecodeHintType,
  GlobalHistogramBinarizer,
  HybridBinarizer,
} from "@zxing/library";
import { HTMLCanvasElementLuminanceSource } from "@zxing/library/esm/browser";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { CameraVideo, UpcScan } from "react-bootstrap-icons";

const supportedFormats = [
  "code_128",
  "code_39",
  "code_93",
  "codabar",
  "aztec",
  "data_matrix",
  "ean_13",
  "ean_8",
  "itf",
  "pdf417",
  "upc_a",
  "upc_e",
  "qr_code",
];

const zxingFormats = [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.CODABAR,
  BarcodeFormat.AZTEC,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.ITF,
  BarcodeFormat.PDF_417,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.QR_CODE,
];

const AUTO_CAMERA_ID = "__auto_environment__";
const scanHelpText = "Scanning... keep the barcode flat, clear, and inside the bright guide box.";
const MAX_SCAN_CANVAS_WIDTH = 1280;
const MIN_SCAN_CANVAS_WIDTH = 720;
const zxingScanInterval = 85;

const environmentConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
};

const deviceConstraints = (deviceId) => ({
  audio: false,
  video: {
    deviceId: { exact: deviceId },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
});

const tuneVideoTrack = async (stream) => {
  const track = stream?.getVideoTracks?.()[0];
  if (!track?.getCapabilities || !track?.applyConstraints) return;

  try {
    const capabilities = track.getCapabilities();
    const advanced = {};

    if (Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes("continuous")) {
      advanced.focusMode = "continuous";
    }

    if (Array.isArray(capabilities.exposureMode) && capabilities.exposureMode.includes("continuous")) {
      advanced.exposureMode = "continuous";
    }

    if (Array.isArray(capabilities.whiteBalanceMode) && capabilities.whiteBalanceMode.includes("continuous")) {
      advanced.whiteBalanceMode = "continuous";
    }

    if (capabilities.zoom?.max && capabilities.zoom.max > 1) {
      advanced.zoom = Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min || 1, 1.4));
    }

    if (Object.keys(advanced).length) {
      await track.applyConstraints({ advanced: [advanced] });
    }
  } catch (_error) {
    // Camera tuning is optional; scanning should continue even when a device ignores it.
  }
};

const getScanRegions = (width, height) => [
  { x: 0, y: 0, width, height },
  { x: width * 0.08, y: height * 0.22, width: width * 0.84, height: height * 0.56 },
  { x: width * 0.14, y: height * 0.32, width: width * 0.72, height: height * 0.36 },
  { x: width * 0.08, y: height * 0.08, width: width * 0.84, height: height * 0.5 },
  { x: width * 0.08, y: height * 0.42, width: width * 0.84, height: height * 0.5 },
];

const resizeScanCanvas = (canvas, sourceWidth, sourceHeight) => {
  const targetWidth = Math.max(
    MIN_SCAN_CANVAS_WIDTH,
    Math.min(MAX_SCAN_CANVAS_WIDTH, Math.round(sourceWidth))
  );
  const targetHeight = Math.max(240, Math.round((targetWidth / sourceWidth) * sourceHeight));

  if (canvas.width !== targetWidth) canvas.width = targetWidth;
  if (canvas.height !== targetHeight) canvas.height = targetHeight;
};

const enhanceCanvasContrast = (canvas, context) => {
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const gray = pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114;
    const boosted = Math.max(0, Math.min(255, (gray - 128) * 1.85 + 136));
    pixels[index] = boosted;
    pixels[index + 1] = boosted;
    pixels[index + 2] = boosted;
  }

  context.putImageData(image, 0, 0);
};

const drawScanCandidate = (video, canvas, region) => {
  let context = null;
  try {
    context = canvas.getContext("2d", { willReadFrequently: true });
  } catch (_error) {
    context = canvas.getContext("2d");
  }

  if (!context) return false;

  resizeScanCanvas(canvas, region.width, region.height);
  context.imageSmoothingEnabled = false;
  context.filter = "contrast(1.35) brightness(1.08) saturate(0)";
  context.drawImage(
    video,
    Math.max(0, region.x),
    Math.max(0, region.y),
    Math.min(video.videoWidth - region.x, region.width),
    Math.min(video.videoHeight - region.y, region.height),
    0,
    0,
    canvas.width,
    canvas.height
  );
  context.filter = "none";
  enhanceCanvasContrast(canvas, context);
  return true;
};

const decodeCanvasCandidate = (reader, canvas) => {
  const source = new HTMLCanvasElementLuminanceSource(canvas);
  const candidates = [
    new BinaryBitmap(new HybridBinarizer(source)),
    new BinaryBitmap(new GlobalHistogramBinarizer(source)),
    new BinaryBitmap(new HybridBinarizer(source.invert())),
  ];

  for (const candidate of candidates) {
    try {
      return reader.decodeBitmap(candidate);
    } catch (_error) {
      // Try the next binarizer/candidate before giving up on this frame.
    }
  }

  return null;
};

const BarcodeScannerDialog = ({
  open = false,
  title = "Scan barcode",
  description = "Point the camera at a barcode. The code will be captured automatically.",
  onClose = () => {},
  onDetected = () => {},
}) => {
  const videoRef = useRef(null);
  const detectorRef = useRef(null);
  const zxingReaderRef = useRef(null);
  const scanCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const onDetectedRef = useRef(onDetected);
  const detectedRef = useRef(false);
  const scanRunRef = useRef(0);
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [lastCode, setLastCode] = useState("");
  const [scanEngine, setScanEngine] = useState("");
  const [scanStatus, setScanStatus] = useState("");
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(AUTO_CAMERA_ID);

  const cameraOptions = [
    { deviceId: AUTO_CAMERA_ID, label: "Auto back camera" },
    ...cameraDevices.map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || `Camera ${index + 1}`,
    })),
  ];

  const switchCamera = () => {
    if (!cameraOptions.length) return;

    const currentIndex = cameraOptions.findIndex((camera) => camera.deviceId === selectedDeviceId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % cameraOptions.length : 0;
    setSelectedDeviceId(cameraOptions[nextIndex].deviceId);
  };

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const runId = scanRunRef.current + 1;
    scanRunRef.current = runId;
    let active = true;

    const isCurrentRun = () => active && scanRunRef.current === runId;
    let lastZxingAttemptAt = 0;
    let nextScanRegionIndex = 0;
    let scanStartedAt = 0;
    let guidanceShown = false;

    const stopScanner = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      if (zxingReaderRef.current) {
        zxingReaderRef.current.reset();
        zxingReaderRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      scanCanvasRef.current = null;
      detectorRef.current = null;
    };

    const handleDetected = (rawValue) => {
      const cleanValue = String(rawValue || "").trim();
      if (!cleanValue || detectedRef.current || !isCurrentRun()) {
        return;
      }

      detectedRef.current = true;
      active = false;
      scanRunRef.current += 1;
      setLastCode(cleanValue);
      setScanStatus(`Barcode detected: ${cleanValue}. Closing scanner...`);
      stopScanner();
      onCloseRef.current();
      window.setTimeout(() => {
        onDetectedRef.current(cleanValue);
      }, 0);
    };

    const scanFrame = async () => {
      if (!isCurrentRun() || !videoRef.current) {
        return;
      }

      const video = videoRef.current;
      const now = performance.now();

      try {
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0 && detectorRef.current) {
          const results = await detectorRef.current.detect(video);
          const rawValue = results?.[0]?.rawValue;

          if (rawValue) {
            handleDetected(rawValue);
            return;
          }
        }
      } catch (_error) {
        // Some browsers throw while the video is still settling. Keep scanning.
      }

      if (
        isCurrentRun() &&
        zxingReaderRef.current &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        now - lastZxingAttemptAt >= zxingScanInterval
      ) {
        lastZxingAttemptAt = now;

        try {
          const result = zxingReaderRef.current.decode(video);
          const rawValue = result?.getText?.() || result?.text;
          if (rawValue) {
            handleDetected(rawValue);
            return;
          }
        } catch (_error) {
          // No barcode in this frame yet. Try again on the next scan tick.
        }

        try {
          if (!scanCanvasRef.current) {
            scanCanvasRef.current = document.createElement("canvas");
          }

          const scanRegions = getScanRegions(video.videoWidth, video.videoHeight);
          const currentRegion = scanRegions[nextScanRegionIndex % scanRegions.length];
          nextScanRegionIndex += 1;

          if (drawScanCandidate(video, scanCanvasRef.current, currentRegion)) {
            const enhancedResult = decodeCanvasCandidate(zxingReaderRef.current, scanCanvasRef.current);
            const rawValue = enhancedResult?.getText?.() || enhancedResult?.text;

            if (rawValue) {
              handleDetected(rawValue);
              return;
            }
          }
        } catch (_error) {
          // Enhanced crop scanning is a fallback; keep the live scanner responsive if it misses.
        }
      }

      if (isCurrentRun() && !guidanceShown && scanStartedAt && now - scanStartedAt > 4500) {
        guidanceShown = true;
        setScanStatus("Still scanning. Move closer, keep the barcode inside the bright guide box, and avoid glare.");
      }

      if (isCurrentRun()) {
        frameRef.current = requestAnimationFrame(scanFrame);
      }
    };

    const startScanner = async () => {
      setError("");
      setLastCode("");
      setIsStarting(true);
      setScanEngine("");
      setScanStatus("");
      detectedRef.current = false;

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("This device does not allow camera access from the browser.");
        }

        let videoDevices = [];
        if (navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          videoDevices = devices.filter((device) => device.kind === "videoinput");
          setCameraDevices(videoDevices);
        }

        const useAutoCamera = selectedDeviceId === AUTO_CAMERA_ID;
        const selectedDeviceExists = videoDevices.some((device) => device.deviceId === selectedDeviceId);
        const deviceId = useAutoCamera || selectedDeviceExists ? selectedDeviceId : AUTO_CAMERA_ID;
        const constraints = deviceId === AUTO_CAMERA_ID ? environmentConstraints : deviceConstraints(deviceId);

        if (!useAutoCamera && !selectedDeviceExists) {
          setSelectedDeviceId(AUTO_CAMERA_ID);
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!isCurrentRun()) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        await tuneVideoTrack(stream);
        if (!isCurrentRun()) {
          stopScanner();
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (!isCurrentRun()) {
          stopScanner();
          return;
        }

        if (navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const refreshedVideoDevices = devices.filter((device) => device.kind === "videoinput");
          setCameraDevices(refreshedVideoDevices);
        }

        let nativeDetectorStarted = false;
        if (window.BarcodeDetector) {
          try {
            let detectorFormats = supportedFormats;
            if (typeof window.BarcodeDetector.getSupportedFormats === "function") {
              const browserFormats = await window.BarcodeDetector.getSupportedFormats();
              detectorFormats = supportedFormats.filter((format) => browserFormats.includes(format));
            }

            if (detectorFormats.length) {
              detectorRef.current = new window.BarcodeDetector({ formats: detectorFormats });
              nativeDetectorStarted = true;
            }
          } catch (_detectorError) {
            detectorRef.current = null;
          }
        }

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, zxingFormats);
        hints.set(DecodeHintType.TRY_HARDER, true);

        try {
          const reader = new BrowserMultiFormatReader(hints, zxingScanInterval);
          zxingReaderRef.current = reader;
        } catch (zxingError) {
          if (!nativeDetectorStarted) {
            throw zxingError;
          }
        }

        if (!isCurrentRun()) {
          stopScanner();
          return;
        }

        setScanEngine(
          nativeDetectorStarted && zxingReaderRef.current
            ? "ZXing + browser scanner"
            : nativeDetectorStarted
              ? "Browser scanner"
              : "ZXing scanner"
        );
        setScanStatus(scanHelpText);
        scanStartedAt = performance.now();
        frameRef.current = requestAnimationFrame(scanFrame);
      } catch (scanError) {
        setError(
          scanError?.name === "NotAllowedError"
            ? "Camera permission was blocked. Allow camera access and try again."
            : scanError?.message || "Barcode scanner could not be started."
        );
      } finally {
        if (active) {
          setIsStarting(false);
        }
      }
    };

    startScanner();

    return () => {
      active = false;
      scanRunRef.current += 1;
      stopScanner();
    };
  }, [open, selectedDeviceId]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{ zIndex: 2300 }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(15, 23, 42, 0.62)",
          backdropFilter: "blur(3px)",
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 28px 80px rgba(15, 23, 42, 0.28)",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 900 }}>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            {description}
          </Typography>
          {scanEngine ? (
            <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 800 }}>
              Using {scanEngine}
            </Typography>
          ) : null}
          {scanStatus && !error ? (
            <Alert severity="info" sx={{ py: 0.75 }}>
              {scanStatus}
            </Alert>
          ) : null}
          {cameraOptions.length > 1 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                color: "#334155",
                fontSize: 13,
                fontWeight: 800,
                position: "relative",
                zIndex: 3,
                pointerEvents: "auto",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="caption" sx={{ color: "#334155", fontWeight: 900 }}>
                  Camera
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={switchCamera}
                  sx={{ textTransform: "none", fontWeight: 800 }}
                >
                  Switch Camera
                </Button>
              </Box>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {cameraOptions.map((camera) => (
                  <Button
                    key={camera.deviceId}
                    variant={camera.deviceId === selectedDeviceId ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setSelectedDeviceId(camera.deviceId)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 800,
                      maxWidth: "100%",
                    }}
                  >
                    {camera.label}
                  </Button>
                ))}
              </Box>
            </Box>
          ) : null}
          <Box
            sx={{
              width: "100%",
              aspectRatio: "4 / 3",
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "#0f172a",
              border: "1px solid #dbe5dd",
              display: "grid",
              placeItems: "center",
              position: "relative",
            }}
          >
            {isStarting ? <CircularProgress sx={{ color: "#ffffff" }} /> : null}
            {error ? (
              <Alert severity="warning" sx={{ m: 2 }}>
                {error}
              </Alert>
            ) : (
              <>
                <Box
                  component="video"
                  ref={videoRef}
                  muted
                  playsInline
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    left: "8%",
                    right: "8%",
                    top: "22%",
                    bottom: "22%",
                    border: "2px solid rgba(255, 255, 255, 0.92)",
                    borderRadius: 1.5,
                    boxShadow: "0 0 0 999px rgba(15, 23, 42, 0.16)",
                    pointerEvents: "none",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    left: "12%",
                    right: "12%",
                    top: "50%",
                    height: 2,
                    bgcolor: "rgba(34, 197, 94, 0.92)",
                    boxShadow: "0 0 18px rgba(34, 197, 94, 0.8)",
                    pointerEvents: "none",
                  }}
                />
              </>
            )}
          </Box>
          <Alert severity="info" icon={<UpcScan />}>
            Use a phone or tablet camera, a PC webcam, or a handheld USB/Bluetooth scanner. On phones, choose the back camera if the scanner opens the selfie camera.
          </Alert>
          {lastCode ? (
            <Alert severity="success" icon={<CameraVideo />}>
              Last scanned code: {lastCode}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 800 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BarcodeScannerDialog;
