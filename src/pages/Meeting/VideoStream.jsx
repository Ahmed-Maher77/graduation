import { FaExpand, FaCompress } from "react-icons/fa";
import PropTypes from "prop-types";
import ProgressBar from "./ProgressBar";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import "./CallPage.scss";
import CorrectedSentence from "./CorrectedSentence";

export const VideoStream = ({
    videoRef,
    canvasRef,
    username,
    isActive,
    onExpandToggle,
    isRemote = false,
    style = {},
    delayWidth,
    bufferWidth,
    progressText,
    correctedSentence,
    aiTranslatorStatus = false,
}) => {
    const isLargeScreen = useSelector(
        (state) => state.windowScreen.isLargeScreen
    );

    // Resize canvas when video loads
    useEffect(() => {
        if (canvasRef?.current && videoRef?.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;

            const resizeCanvas = () => {
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
            };

            if (video.readyState >= 2) {
                resizeCanvas();
            } else {
                video.addEventListener("loadedmetadata", resizeCanvas);
                return () =>
                    video.removeEventListener("loadedmetadata", resizeCanvas);
            }
        }
    }, [canvasRef, videoRef]);

    return (
        <div
            className={`stream-container relative ${isActive ? "active" : ""}`}
            style={style}
        >
            <h2
                className="text-center flex items-center justify-center gap-[7px]"
                style={{
                    fontSize: `${
                        !isActive
                            ? isLargeScreen
                                ? "1.2rem"
                                : "1.05rem"
                            : isRemote
                            ? "0.8rem"
                            : isLargeScreen
                            ? "1.2rem"
                            : "1.05rem"
                    }`,
                }}
            >
                {username}
                {!isRemote && (
                    <span className="text-[0.9em] text-[#d9d9d9]">(You)</span>
                )}
                {/* AI Translator Status Indicator */}
                <div
                    className="ai-translator-indicator ml-2"
                    title={
                        aiTranslatorStatus
                            ? "AI Translator Active"
                            : "AI Translator Inactive"
                    }
                >
                    <div
                        className={`w-3 h-3 rounded-full border-2 border-white ${
                            aiTranslatorStatus ? "bg-green-500" : "bg-red-500"
                        }`}
                        style={{
                            boxShadow: "0 0 4px rgba(0,0,0,0.3)",
                        }}
                    />
                </div>
            </h2>

            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                    transform: !isRemote ? "scaleX(-1)" : "none",
                    maxHeight: isActive ? "90vh" : "auto",
                }}
                muted={!isRemote}
            ></video>

            {canvasRef && (
                <canvas ref={canvasRef} style={{ display: "none" }} />
            )}

            {/* expand/compress icon */}
            {onExpandToggle && (
                <button className="expand-button" onClick={onExpandToggle}>
                    {isActive ? <FaCompress /> : <FaExpand />}
                </button>
            )}

            {/* Progress Bar */}
            {(delayWidth !== undefined || bufferWidth !== undefined) && (
                <div className="buffer-progress-bar flex items-center gap-[5px]">
                    <ProgressBar
                        delayWidth={delayWidth}
                        bufferWidth={bufferWidth}
                        styles={styles}
                    />
                    <div style={styles.progressText}>{progressText}</div>
                </div>
            )}

            {/* Corrected Sentence */}
            <CorrectedSentence correctedSentence={correctedSentence} />
        </div>
    );
};

VideoStream.propTypes = {
    videoRef: PropTypes.object.isRequired,
    canvasRef: PropTypes.object,
    username: PropTypes.string.isRequired,
    isActive: PropTypes.bool.isRequired,
    onExpandToggle: PropTypes.func,
    isRemote: PropTypes.bool,
    style: PropTypes.object,
    delayWidth: PropTypes.number,
    bufferWidth: PropTypes.number,
    progressText: PropTypes.string,
    correctedSentence: PropTypes.string,
    aiTranslatorStatus: PropTypes.bool,
};

const styles = {
    progressBarContainer: {
        width: "calc(100% - 50px)",
        height: 26,
        backgroundColor: "#e9ecef",
        borderRadius: 0,
        overflow: "hidden",
        marginTop: 0,
        position: "relative",
    },
    progressFill: {
        position: "absolute",
        top: 0,
        left: "33.33%",
        height: "100%",
        backgroundColor: "#17a2b8",
        transition: "none",
        zIndex: 1,
    },
    delayFill: {
        position: "absolute",
        top: 0,
        left: 0,
        height: "100%",
        backgroundColor: "#ffc107",
        transition: "none",
        zIndex: 1,
    },
    dividerLine: {
        position: "absolute",
        top: 0,
        left: "33.33%",
        width: 2,
        height: "100%",
        backgroundColor: "#000",
        zIndex: 2,
    },
    delayLabel: {
        position: "absolute",
        top: "50%",
        left: "16.67%",
        transform: "translate(-50%, -50%)",
        color: "#495057",
        fontSize: "0.9em",
        fontWeight: 500,
        zIndex: 3,
        pointerEvents: "none",
    },
    frameBufferLabel: {
        position: "absolute",
        top: "50%",
        left: "66.67%",
        transform: "translate(-50%, -50%)",
        color: "#495057",
        fontSize: "0.9em",
        fontWeight: 500,
        zIndex: 3,
        pointerEvents: "none",
    },
    progressText: {
        textAlign: "center",
        fontSize: "0.55em",
        color: "#fff",
        fontWeight: 500,
        width: "45px",
    },
};
