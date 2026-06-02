import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { Camera, XCircle } from "react-bootstrap-icons";

const videoStyle = {
  width: "100%",
  aspectRatio: "4 / 3",
  borderRadius: 12,
  background: "#0f172a",
  objectFit: "cover",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 2600,
  display: "grid",
  placeItems: "center",
  padding: 16,
  background: "rgba(15, 23, 42, 0.62)",
  backdropFilter: "blur(3px)",
};

const dialogStyle = {
  width: "min(760px, 100%)",
  maxHeight: "calc(100vh - 32px)",
  overflow: "auto",
  borderRadius: 16,
  background: "#ffffff",
  boxShadow: "0 28px 80px rgba(15, 23, 42, 0.28)",
};

export default function ImageCaptureDialog({
  show,
  title = "Capture image",
  fileNamePrefix = "image-capture",
  onClose,
  onCapture,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsReady(false);
  };

  useEffect(() => {
    if (!show) {
      stopCamera();
      return undefined;
    }

    let isMounted = true;

    const startCamera = async () => {
      setError("");
      setIsLoading(true);
      setIsReady(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera capture is not supported in this browser.");
        setIsLoading(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setIsReady(true);
        }
      } catch (cameraError) {
        setError(
          cameraError?.name === "NotAllowedError"
            ? "Camera permission was blocked. Allow camera access and try again."
            : "Could not start the camera. Try another browser or check the device camera."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [show]);

  const handleClose = () => {
    stopCamera();
    onClose?.();
  };

  const captureFrame = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setError("The camera is not ready yet. Please wait a moment and try again.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Could not capture the image. Please try again.");
          return;
        }

        const file = new File([blob], `${fileNamePrefix}-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        onCapture?.(file);
        handleClose();
      },
      "image/jpeg",
      0.92
    );
  };

  useEffect(() => {
    if (!show) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [show]);

  if (!show) {
    return null;
  }

  return (
    <div style={overlayStyle} role="presentation" onClick={(event) => event.stopPropagation()}>
      <div
        style={dialogStyle}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="d-flex align-items-center justify-content-between gap-3 px-4 py-3 border-bottom">
          <h5 className="m-0 fw-bold">{title}</h5>
          <Button type="button" variant="light" onClick={handleClose} aria-label="Close image capture">
            <XCircle />
          </Button>
        </div>
        <div className="px-4 py-3">
        {error ? <Alert variant="danger">{error}</Alert> : null}
        <div className="position-relative">
          <video ref={videoRef} playsInline muted style={videoStyle} />
          {isLoading ? (
            <div className="position-absolute top-50 start-50 translate-middle text-white d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              Starting camera...
            </div>
          ) : null}
        </div>
        <canvas ref={canvasRef} className="d-none" />
        <div className="text-muted small mt-2">
          Camera capture works on localhost or secure HTTPS pages.
        </div>
        </div>
        <div className="d-flex flex-column flex-sm-row justify-content-sm-end gap-2 px-4 py-3 border-top">
          <Button type="button" variant="light" onClick={handleClose}>
            <XCircle className="me-2" />
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={captureFrame} disabled={!isReady || isLoading}>
            <Camera className="me-2" />
            Capture
          </Button>
        </div>
      </div>
    </div>
  );
}
