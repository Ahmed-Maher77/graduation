import { useState, useRef, useEffect } from "react";
import {
    collection,
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    deleteDoc,
    runTransaction,
    updateDoc,
    increment,
} from "firebase/firestore";
import { firestore } from "../../utils/firebase-config";
import {
    FaDesktop,
    FaMicrophone,
    FaMicrophoneSlash,
    FaVideo,
    FaVideoSlash,
    FaExpand,
    FaCompress,
    FaClock,
    FaShare,
    FaSignOutAlt,
    FaUser,
} from "react-icons/fa";
import Swal from "sweetalert2";
import "./CallPage.scss";
import { useDispatch, useSelector } from "react-redux";
import {
    setCallId,
    setUserType,
    setComingFrom_CallPage,
} from "../../utils/redux-toolkit/webrtcSlice";
import { MdCallEnd } from "react-icons/md";
import { Navigate, replace, useNavigate, useParams } from "react-router-dom";
import joinSound from "../../assets/audios/join-sound.mp3";
import leaveSound from "../../assets/audios/leave-sound.mp3";
import { CallDuration } from "./CallDuration";
import { ParticipantCount } from "./ParticipantCount";
import { NotificationPopup } from "./NotificationPopup";
import { VideoStream } from "./VideoStream";
import {
    EndCallButton,
    LeaveCallButton,
    ScreenShareButton,
    ToggleAudioButton,
    ToggleCameraButton,
} from "./CallControls";
import { CallHeader } from "./CallHeader";
import PredictionInfo from "./PredictionInfo";
import CorrectedSentence from "./CorrectedSentence";
import FloatingGear from "./FloatingGear";
import SettingsPopup from "./SettingsPopup/SettingsPopup";
import CallChat from "./CallChat/CallChat";
import useFetchUserImage from "../../utils/custom_hooks/userData/useFetchUserImage";

const CallPage = () => {
    // ===================== State Management =====================
    const { callId: urlCallId } = useParams(); // Get callId from URL
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux state access
    const stored_callId = useSelector((store) => store.webrtc.callId);
    const userType = useSelector((store) => store.webrtc.userType);
    const comingFrom_CallPage = useSelector(
        (store) => store.webrtc.comingFrom_CallPage
    );

    // Local state
    const [callId, setLocalCallId] = useState(stored_callId || urlCallId || "");
    const [isLoading, setIsLoading] = useState(false);
    const [isAnswering, setIsAnswering] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isSharingScreen, setIsSharingScreen] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [popupType, setPopupType] = useState("");
    const [activeVideo, setActiveVideo] = useState(null);
    const [isRemoteExists, setIsRemoteExists] = useState(false);
    const [callStartTime, setCallStartTime] = useState(null);
    const [callDuration, setCallDuration] = useState(null);
    const [isCallCreator, setIsCallCreator] = useState(false);
    const [participantCount, setParticipantCount] = useState(1);
    const [maxParticipants] = useState(2);
    const [isTimeOut, setIsTimeOut] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [participantUsername, setParticipantUsername] = useState("");

    // Refs for persistent values
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localCanvasRef = useRef(null);
    const pc = useRef(null);
    const localStream = useRef(null);
    const screenStream = useRef(null);
    const isCallEnded = useRef(false);
    const originalUrl = useRef(window.location.href);
    const [isWebShareSupported, setIsWebShareSupported] = useState(false);
    const joinSoundRef = useRef(new Audio(joinSound));
    const leaveSoundRef = useRef(new Audio(leaveSound));

    // Data Channel refs for sharing corrected sentence
    const dataChannel = useRef(null);
    const remoteDataChannel = useRef(null);

    // Prediction State & Logic
    const [showPrediction, setShowPrediction] = useState(false);
    const [topPrediction, setTopPrediction] = useState({
        label: "",
        probability: 0,
    });

    // Subtitles State & Logic
    const [showSubtitles, setShowSubtitles] = useState(false);

    // Corrected Sentence State & Logic
    const [correctedSentence, setCorrectedSentence] = useState("");
    const [remoteCorrectedSentence, setRemoteCorrectedSentence] = useState("");
    const [dataChannelStatus, setDataChannelStatus] = useState("disconnected");

    // AI Translator Status State & Logic
    const [localAiTranslatorStatus, setLocalAiTranslatorStatus] =
        useState(false);
    const [remoteAiTranslatorStatus, setRemoteAiTranslatorStatus] =
        useState(false);

    // Language Selection State & Logic
    const [selectedLanguage, setSelectedLanguage] = useState("English");

    // Settings State & Logic
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Call Chat State & Logic
    const [isChatVisible, setIsChatVisible] = useState(false);

    // Connection State
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState(null);
    const [socket, setSocket] = useState(null);
    const [sendIntervalId, setSendIntervalId] = useState(null);
    const retryTimeoutRef = useRef(null);
    const FRAME_INTERVAL_MS = Math.round(1000 / 30);
    const wsUrl = `ws://localhost:8000/ws`;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds

    // Progress bar Logic
    const [progress, setProgress] = useState({
        bufferPercentage: 0,
        delay: false,
        delayProgress: 0,
        queueSize: 0,
        targetSize: 0,
    });
    const scaledBuffer = (progress.bufferPercentage * 2) / 3;
    const scaledDelay = (progress.delayProgress * 100) / 3;
    const bufferWidth = progress.delay ? 0 : scaledBuffer;
    const delayWidth = progress.delay ? scaledDelay : 33.33;
    const progressText = progress.delay
        ? `0% (0/${progress.targetSize})`
        : `${Math.round(progress.bufferPercentage)}% (${progress.queueSize}/${
              progress.targetSize
          })`;

    // user profile image
    const {
        username,
        image: myImage,
        userId: myUserId,
    } = useSelector((state) => state.api.userData);
    const { data } = useFetchUserImage(myUserId, myImage);
    const myProfileImage = data?.photoUrl || null;
    const [remoteUserProfileImage, setRemoteUserProfileImage] = useState("");

    // STUN servers for WebRTC
    const servers = {
        iceServers: [
            {
                urls: [
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                ],
            },
        ],
    };

    // ============================= Effect Hooks =============================
    // Show leave button after 1s
    useEffect(() => {
        setTimeout(() => {
            setIsTimeOut(true);
        }, 1000);
    }, [isTimeOut]);

    // to handle reloading the call page
    useEffect(() => {
        if (comingFrom_CallPage) {
            dispatch(setComingFrom_CallPage(false));
            if (sessionStorage.getItem("userType") === "creator") {
                endCall();
            }
            setTimeout(() => {
                window.location.href = "/meeting";
            }, 100);
        }
    }, []);

    // Handle direct URL call joining
    useEffect(() => {
        if (urlCallId && !stored_callId) {
            dispatch(setUserType("guest"));
            dispatch(setCallId(urlCallId));
            setLocalCallId(urlCallId);
        }
    }, [urlCallId, dispatch, stored_callId]);

    // Redirect if no userType or callId
    useEffect(() => {
        if (!userType && !callId) {
            navigate("/meeting", { replace: true });
        }
    }, [userType, callId, navigate]);

    // Auto-answer call for guests joined via URL
    useEffect(() => {
        if (userType === "guest" && callId) {
            answerCall();
        }
    }, [userType, callId]);

    // Prevent accidental close/refresh/back during call
    // for call creator
    useEffect(() => {
        if (isCallCreator && callId) {
            const handleBeforeUnload = (event) => {
                if (isCallEnded.current) {
                    window.removeEventListener(
                        "beforeunload",
                        handleBeforeUnload
                    );
                    return;
                }
                event.preventDefault();
                sessionStorage.setItem("userType", userType);
                event.returnValue = "";
                Swal.fire({
                    title: "Leave Call?",
                    text: "If you leave, the call will be ended.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Leave",
                    cancelButtonText: "Stay",
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.removeEventListener(
                            "beforeunload",
                            handleBeforeUnload
                        );
                        window.removeEventListener("popstate", handlePopState);
                        endCall();
                        window.location.href = "/meeting";
                    }
                });
                return "";
            };
            const handlePopState = (event) => {
                if (isCallEnded.current) {
                    window.removeEventListener("popstate", handlePopState);
                    return;
                }
                event.preventDefault();
                event.returnValue = "";
                Swal.fire({
                    title: "Leave Call?",
                    text: "If you leave, the call will be ended.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Leave",
                    cancelButtonText: "Stay",
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.removeEventListener("popstate", handlePopState);
                        endCall();
                        window.location.href = "/meeting";
                    } else {
                        // Re-push current state to prevent back
                        history.pushState(null, "", window.location.href);
                    }
                });
            };
            window.addEventListener("beforeunload", handleBeforeUnload);
            window.addEventListener("popstate", handlePopState);
            // Prevent immediate navigation when pressing "Back"
            history.pushState(null, "", window.location.href);
            return () => {
                window.removeEventListener("beforeunload", handleBeforeUnload);
                window.removeEventListener("popstate", handlePopState);
            };
        }
    }, [isCallCreator, callId]);
    // for call guests
    useEffect(() => {
        if (!isCallCreator && callId) {
            const handleBeforeUnload = (event) => {
                if (isCallEnded.current) {
                    window.removeEventListener(
                        "beforeunload",
                        handleBeforeUnload
                    );
                    return;
                }
                event.preventDefault();
                event.returnValue = "";
                Swal.fire({
                    title: "Leave Call?",
                    text: "Are you sure you want to leave the call?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Leave",
                    cancelButtonText: "Stay",
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.removeEventListener(
                            "beforeunload",
                            handleBeforeUnload
                        );
                        window.removeEventListener("popstate", handlePopState);
                        leaveCall();
                    }
                });
                return "";
            };
            const handlePopState = (event) => {
                if (isCallEnded.current) {
                    window.removeEventListener("popstate", handlePopState);
                    return;
                }
                event.preventDefault();
                event.returnValue = "";
                Swal.fire({
                    title: "Leave Call?",
                    text: "Are you sure you want to leave the call?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Leave",
                    cancelButtonText: "Stay",
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.removeEventListener("popstate", handlePopState);
                        leaveCall();
                    } else {
                        history.pushState(null, "", window.location.href);
                    }
                });
            };
            window.addEventListener("beforeunload", handleBeforeUnload);
            window.addEventListener("popstate", handlePopState);
            history.pushState(null, "", window.location.href);
            return () => {
                window.removeEventListener("beforeunload", handleBeforeUnload);
                window.removeEventListener("popstate", handlePopState);
            };
        }
    }, [callId, isCallCreator]);

    // Check for Web Share API support
    useEffect(() => {
        setIsWebShareSupported(!!navigator.share);
    }, []);

    // Start webcam (once the user naviagtes to the call page)
    useEffect(() => {
        if (userType) {
            dispatch(setComingFrom_CallPage(true));
            startWebcam();
        }

        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            if (sendIntervalId) clearInterval(sendIntervalId);
            if (socket) socket.close();
        };
    }, [userType]);

    // Show/hide loader based on isAnswering state
    useEffect(() => {
        if (isAnswering) {
            Swal.fire({
                title: "Answering Call...",
                text: "Please wait while we connect you to the call.",
                allowEscapeKey: false,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
            });
        } else {
            Swal.close();
        }
    }, [isAnswering]);

    // Update URL when callId changes
    useEffect(() => {
        if (callId) {
            // Update the URL with the callId
            const newUrl = `${window.location.origin}/call/${callId}`;
            window.history.pushState({ callId }, `Call ${callId}`, newUrl);
        }
    }, [callId]);

    // Handle URL-based call joining
    useEffect(() => {
        const path = window.location.pathname;
        const callIdFromUrl = path.split("/call/")[1];
        if (callIdFromUrl) {
            dispatch(setUserType("guest"));
            dispatch(setCallId(callIdFromUrl));
            setLocalCallId(callIdFromUrl);
        }
    }, [dispatch]);

    // Handle call duration
    useEffect(() => {
        let intervalId;
        if (callStartTime) {
            intervalId = setInterval(() => {
                setCurrentTime(Date.now());
            }, 1000);
        }
        return () => clearInterval(intervalId);
    }, [callStartTime]);

    // Firestore listener for call updates
    useEffect(() => {
        if (!callId) return;

        const callDoc = doc(firestore, "calls", callId);
        const unsubscribe = onSnapshot(callDoc, (snapshot) => {
            if (!snapshot.exists()) return;

            const data = snapshot.data();
            const participants = Math.max(0, Number(data.participants) || 0);
            const maxParticipants = Number(data.maxParticipants) || 2;

            setParticipantCount(Math.min(participants, maxParticipants));

            // Get participant username based on user type
            if (userType === "creator") {
                setParticipantUsername(data.guestUsername || "Participant");
            } else {
                setParticipantUsername(data.creatorUsername || "Participant");
            }

            if (data?.callEnded) endCall();
        });

        return unsubscribe;
    }, [callId, userType]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pc.current) {
                pc.current.close();
            }
            if (localStream.current) {
                localStream.current
                    .getTracks()
                    .forEach((track) => track.stop());
            }
            if (screenStream.current) {
                screenStream.current
                    .getTracks()
                    .forEach((track) => track.stop());
            }
            // Cleanup data channels
            if (dataChannel.current) {
                dataChannel.current.close();
            }
            if (remoteDataChannel.current) {
                remoteDataChannel.current.close();
            }
        };
    }, []);

    // Send corrected sentence to remote participant
    const sendCorrectedSentence = (sentence) => {
        if (
            !(dataChannel.current && dataChannel.current.readyState === "open")
        ) {
            console.log(
                `${userType} data channel not open, skipping sendCorrectedSentence`
            );
            return;
        }
        const message = {
            type: "correctedSentence",
            sentence: sentence || "",
            timestamp: Date.now(),
        };
        dataChannel.current.send(JSON.stringify(message));
        console.log(
            `${userType} sent corrected sentence via data channel:`,
            sentence
        );
    };

    function sendProfileImage(image) {
        if (
            !(dataChannel.current && dataChannel.current.readyState === "open")
        ) {
            console.log(
                `${userType} data channel not open, skipping sendProfileImage`
            );
            return;
        }
        const message = {
            type: "profileImage",
            image: myProfileImage,
        };
        dataChannel.current.send(JSON.stringify(message));
        console.log(
            `${userType} sent profile image via data channel:`,
            myProfileImage
        );
    }

    // Send AI Translator status to remote participant
    const sendAiTranslatorStatus = (status) => {
        if (
            !(dataChannel.current && dataChannel.current.readyState === "open")
        ) {
            console.log(
                `${userType} data channel not open, skipping sendAiTranslatorStatus`
            );
            return;
        }
        const message = {
            type: "aiTranslatorStatus",
            status: status,
            timestamp: Date.now(),
        };
        dataChannel.current.send(JSON.stringify(message));
        console.log(
            `${userType} sent AI Translator status via data channel:`,
            status
        );
    };

    // Guarded useEffect for corrected sentence
    useEffect(() => {
        if (dataChannel.current && dataChannel.current.readyState === "open") {
            sendCorrectedSentence(correctedSentence);
        }
    }, [correctedSentence, dataChannelStatus]);

    // Guarded useEffect for profile image
    useEffect(() => {
        if (dataChannel.current && dataChannel.current.readyState === "open") {
            sendProfileImage(myProfileImage);
        }
    }, [myProfileImage, dataChannelStatus]);

    // Guarded useEffect for AI Translator status
    useEffect(() => {
        if (dataChannel.current && dataChannel.current.readyState === "open") {
            sendAiTranslatorStatus(localAiTranslatorStatus);
        }
    }, [localAiTranslatorStatus, dataChannelStatus]);

    // ============================= WebRTC Functions =============================
    // Start webcam
    const startWebcam = async () => {
        try {
            // Initialize media devices
            localStream.current = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            localVideoRef.current.srcObject = localStream.current;

            // Setup peer connection
            pc.current = new RTCPeerConnection(servers);

            // Setup data channel for sharing corrected sentence
            setupDataChannel();

            // connection state change handler
            pc.current.oniceconnectionstatechange = () => {
                if (
                    pc.current.iceConnectionState === "disconnected" ||
                    pc.current.iceConnectionState === "failed"
                ) {
                    // play sound if call has already ended
                    try {
                        leaveSoundRef.current.currentTime = 0;
                        leaveSoundRef.current.play().catch((error) => {
                            console.log("Audio play failed:", error);
                        });
                    } catch (error) {
                        console.error("Error playing leave sound:", error);
                    }
                    // Clear remote video and update state
                    setIsRemoteExists(false);
                    setRemoteAiTranslatorStatus(false);
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = null;
                    }
                    // Notify user
                    showPopup("Participant has left the call", "info");
                }
            };

            // Add local tracks to connection
            localStream.current
                .getTracks()
                .forEach((track) =>
                    pc.current.addTrack(track, localStream.current)
                );

            // Handle remote stream
            pc.current.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                    setIsRemoteExists(true);
                    // Play join sound
                    try {
                        joinSoundRef.current.currentTime = 0;
                        joinSoundRef.current.play().catch((error) => {
                            console.log("Audio play failed:", error);
                        });
                    } catch (error) {
                        console.error("Error playing join sound:", error);
                    }
                }
            };

            // Start call based on user role
            setTimeout(() => {
                if (userType === "creator") {
                    createCall();
                } else if (userType === "guest") {
                    answerCall();
                }
            }, 1000);
        } catch (error) {
            showPopup("Error accessing webcam", "error");
        }
    };

    // ============================= Call Managment =============================
    // Create a call
    const createCall = async () => {
        if (!pc.current) return;
        setIsLoading(true);
        isCallEnded.current = false; // Reset the call ended flag

        try {
            // Create offer
            const offerDescription = await pc.current.createOffer();
            await pc.current.setLocalDescription(offerDescription);

            // Setup Firestore call document
            const callStartTime = new Date();
            const callDoc = doc(collection(firestore, "calls"));
            await setDoc(callDoc, {
                offer: {
                    type: offerDescription.type,
                    sdp: offerDescription.sdp,
                },
                callStartTime: callStartTime.toISOString(),
                participants: 1,
                maxParticipants: maxParticipants,
                creatorUsername: username,
            });

            // Set local states
            setCallStartTime(callStartTime);
            setLocalCallId(callDoc.id);
            setIsCallCreator(true);
            setParticipantCount(1);

            // Setup candidate collections
            const offerCandidates = collection(callDoc, "offerCandidates");
            const answerCandidates = collection(callDoc, "answerCandidates");

            // Handle ICE candidates
            pc.current.onicecandidate = (event) => {
                if (event.candidate) {
                    setDoc(doc(offerCandidates), event.candidate.toJSON());
                }
            };

            // Listen for updates to the call document (remote answer)
            onSnapshot(callDoc, (snapshot) => {
                const data = snapshot.data();
                // Add null checks and sanitize participant count
                const participants = Number(data?.participants) || 1;
                const maxParticipants = Number(data?.maxParticipants) || 2;
                if (data?.answer && !pc.current.currentRemoteDescription) {
                    const answerDescription = new RTCSessionDescription(
                        data.answer
                    );
                    pc.current
                        .setRemoteDescription(answerDescription)
                        .catch((error) =>
                            console.error(
                                "Error setting remote description:",
                                error
                            )
                        );
                }

                // Update local participant count
                setParticipantCount(Math.min(participants, maxParticipants));
                console.log(
                    "ParticipantCount: ",
                    Math.min(participants, maxParticipants)
                );

                // Listen for call end
                if (data?.callEnded) {
                    endCall();
                }
            });

            // Listen for answer candidates
            onSnapshot(answerCandidates, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const candidate = new RTCIceCandidate(
                            change.doc.data()
                        );
                        pc.current.addIceCandidate(candidate);
                    }
                });
            });

            setIsLoading(false);
        } catch (error) {
            console.error("Error creating call:", error);
            showPopup("Failed to start call", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Answer/Join a Call
    const answerCall = async () => {
        if (!pc.current || isCallEnded.current || !callId) return;

        isCallEnded.current = false;
        setIsAnswering(true);

        try {
            const callDoc = doc(firestore, "calls", callId);

            // 1. Perform transaction and get call data
            const { offer, callStartTime } = await runTransaction(
                firestore,
                async (transaction) => {
                    const callSnapshot = await transaction.get(callDoc);
                    if (!callSnapshot.exists())
                        throw new Error("Call does not exist");
                    const data = callSnapshot.data();
                    // Validate call state
                    if (data.callEnded) throw new Error("Call has ended");
                    if (data.participants >= data.maxParticipants) {
                        throw new Error("Call is full");
                    }
                    if (!data.offer?.type || !data.offer?.sdp) {
                        throw new Error("Invalid call invitation");
                    }

                    // Update participant count
                    transaction.update(callDoc, {
                        participants: increment(1),
                    });

                    // Return needed values
                    return {
                        offer: data.offer,
                        callStartTime: data.callStartTime,
                    };
                }
            );

            // 2. Setup after successful transaction
            setCallStartTime(new Date(callStartTime));
            setIsCallCreator(false);

            // 3. Configure candidates collections
            const answerCandidates = collection(callDoc, "answerCandidates");
            const offerCandidates = collection(callDoc, "offerCandidates");

            // 4. Configure ICE handlers
            pc.current.onicecandidate = (event) => {
                event.candidate &&
                    setDoc(doc(answerCandidates), event.candidate.toJSON());
            };

            // 5. Set remote description
            await pc.current.setRemoteDescription(
                new RTCSessionDescription(offer)
            );

            // 6. Create and set local answer
            const answer = await pc.current.createAnswer();
            await pc.current.setLocalDescription(answer);

            // 7. Save answer to Firestore
            await setDoc(
                callDoc,
                { answer, guestUsername: username },
                { merge: true }
            );

            // 8. Listen for offer candidates
            onSnapshot(offerCandidates, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    change.type === "added" &&
                        pc.current.addIceCandidate(
                            new RTCIceCandidate(change.doc.data())
                        );
                });
            });

            // 9. Set call state
            console.log("Call answered");
            setIsRemoteExists(true);
            setHasJoined(true);

            // 10. Update URL
            window.history.pushState(
                { callId },
                `Call ${callId}`,
                `/call/${callId}`
            );
        } catch (error) {
            console.error("Answering error:", error);

            // Handle specific errors
            let errorMessage = "Failed to join call. Please try again.";
            if (error.message.includes("full"))
                errorMessage = "Call is full (max 2 participants)";
            if (error.message.includes("ended"))
                errorMessage = "Call has already ended";
            if (error.message.includes("invalid"))
                errorMessage = "Invalid call invitation";

            await Swal.fire({
                title: "Error",
                text: errorMessage,
                icon: "error",
                confirmButtonText: "OK",
                allowEscapeKey: false,
                allowOutsideClick: false,
            }).then((result) => {
                if (result.isConfirmed) {
                    leaveCall();
                    navigate("/meeting", { replace: true });
                    setTimeout(() => {
                        window.location.reload();
                    }, 200);
                }
            });
        } finally {
            setIsAnswering(false);
        }
    };

    // Leave Call (for guests)
    const leaveCall = async () => {
        try {
            if (callId && !isCallCreator) {
                await runTransaction(firestore, async (transaction) => {
                    // Get the call document from Firestore
                    const callDoc = doc(firestore, "calls", callId);
                    const callSnapshot = await transaction.get(callDoc);

                    // If the call document doesn't exist, exit
                    if (!callSnapshot.exists()) return;

                    // Get the current participant count
                    const data = callSnapshot.data();
                    const currentParticipants = data.participants || 0;

                    // Decrement participant count if there are participants
                    if (currentParticipants > 0) {
                        transaction.update(callDoc, {
                            participants: increment(-1),
                        });
                    }
                });
            }
        } catch (error) {
            console.error("Leave transaction error:", error);
        }

        if (isCallEnded.current) return;
        isCallEnded.current = true;

        // Play leave sound
        try {
            leaveSoundRef.current.currentTime = 0;
            await leaveSoundRef.current.play();
        } catch (error) {
            console.error("Error playing leave sound:", error);
        }

        // Close peer connection
        if (pc.current) {
            pc.current.close();
        }

        // Cleanup data channels
        if (dataChannel.current) {
            dataChannel.current.close();
        }
        if (remoteDataChannel.current) {
            remoteDataChannel.current.close();
        }

        // Stop all media tracks
        if (localStream.current) {
            localStream.current.getTracks().forEach((track) => track.stop());
        }
        if (screenStream.current) {
            screenStream.current.getTracks().forEach((track) => track.stop());
        }

        // Reset state
        setLocalCallId("");
        dispatch(setCallId(""));
        dispatch(setUserType(""));
        setIsRemoteExists(false);
        setCallStartTime(null);
        setCallDuration(null);
        setRemoteCorrectedSentence("");
        setRemoteUserProfileImage("");
        setDataChannelStatus("disconnected");
        dispatch(setComingFrom_CallPage(false));

        // Revert URL
        revertUrl();

        // Show confirmation
        Swal.fire({
            title: "You left the call",
            icon: "success",
            confirmButtonText: "OK",
        }).then(() => {
            navigate("/meeting", { replace: true });
            window.location.reload();
        });

        // Cleanup audio elements
        setTimeout(() => {
            joinSoundRef.current.pause();
            leaveSoundRef.current.pause();
            joinSoundRef.current.remove();
            leaveSoundRef.current.remove();
        }, 500);
    };

    // End Call (for creator)
    const endCall = async () => {
        if (isCallCreator && callId) {
            const callDoc = doc(firestore, "calls", callId);
            await runTransaction(firestore, async (transaction) => {
                // Get the call document from Firestore
                const callSnapshot = await transaction.get(callDoc);

                // If the call document doesn't exist, exit
                if (!callSnapshot.exists()) return;

                const data = callSnapshot.data();
                if (data.callEnded) return; // Already ended

                // Mark the call as ended and reset participant count
                transaction.update(callDoc, {
                    callEnded: true,
                    participants: 0,
                    callEndedTime: new Date().toISOString(),
                });
            });
        }

        if (isCallEnded.current) {
            console.log("Call has already ended. Skipping...");
            return;
        }
        isCallEnded.current = true;

        // Play leave sound
        try {
            leaveSoundRef.current.currentTime = 0;
            await leaveSoundRef.current.play();
        } catch (error) {
            console.error("Error playing leave sound:", error);
        }

        // Calculate duration
        const duration = callStartTime
            ? Math.floor((Date.now() - callStartTime.getTime()) / 1000)
            : null;

        // Show SweetAlert message with call duration
        Swal.fire({
            title: "Call Ended",
            text: duration
                ? `Call duration: ${formatDurationForPopup(duration)}`
                : "The call has been ended",
            icon: "info",
            confirmButtonText: "OK",
            allowOutsideClick: false,
            allowEscapeKey: false,
        }).then((result) => {
            if (result.isConfirmed) {
                navigate("/meeting", { replace: true });
                window.location.reload();
            }
        });

        // Cleanup resources
        if (pc.current) pc.current.close();
        if (localStream.current) {
            localStream.current.getTracks().forEach((track) => track.stop());
        }
        if (screenStream.current) {
            screenStream.current.getTracks().forEach((track) => track.stop());
        }

        // Cleanup data channels
        if (dataChannel.current) {
            dataChannel.current.close();
        }
        if (remoteDataChannel.current) {
            remoteDataChannel.current.close();
        }

        // Reset call state
        setLocalCallId("");
        dispatch(setCallId(""));
        dispatch(setUserType(""));
        setIsRemoteExists(false);
        setIsCallCreator(false);
        setCallStartTime(null);
        setCallDuration(null);
        setRemoteCorrectedSentence("");
        setRemoteUserProfileImage("");
        setDataChannelStatus("disconnected");
        setLocalAiTranslatorStatus(false);
        setRemoteAiTranslatorStatus(false);
        setSelectedLanguage("English");
        dispatch(setComingFrom_CallPage(false));

        // Revert the URL to the original state
        revertUrl();

        // Cleanup audio elements
        setTimeout(() => {
            joinSoundRef.current.pause();
            leaveSoundRef.current.pause();
            joinSoundRef.current.remove();
            leaveSoundRef.current.remove();
        }, 500);
    };

    // ============================= AI Model Logic =============================
    const handleToggleConnection = () => {
        if (isConnected) {
            disconnectWebSocket();
            setLocalAiTranslatorStatus(false);
        } else {
            connectWebSocket();
            setLocalAiTranslatorStatus(true);
        }
    };

    const captureAndSendFrame = (socket) => {
        const canvas = localCanvasRef.current;
        const context = canvas?.getContext("2d");
        const video = localVideoRef.current;

        if (
            socket.readyState === WebSocket.OPEN &&
            canvas &&
            context &&
            video &&
            video.readyState >= 2
        ) {
            try {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(
                    (blob) => {
                        if (blob) socket.send(blob);
                    },
                    "image/jpeg",
                    0.85
                );
            } catch (error) {
                console.error("Error capturing frame:", error);
            }
        }
    };

    const getConfidenceClass = (probability) => {
        if (probability > 50) return "pred-high";
        if (probability > 30) return "pred-mid";
        return "pred-low";
    };

    const connectWebSocket = (retryCount = 0) => {
        if (retryCount >= MAX_RETRIES) {
            setConnectionError(
                "Failed to connect after multiple attempts. Please check if the server is running."
            );
            setIsConnecting(false);
            return;
        }

        setIsConnecting(true);
        setConnectionError(null);

        try {
            const newSocket = new WebSocket(wsUrl);
            newSocket.binaryType = "arraybuffer";

            newSocket.onopen = () => {
                console.log("WebSocket connected.");
                setIsConnected(true);
                setIsConnecting(false);
                setConnectionError(null);
                if (localVideoRef.current?.srcObject?.active) {
                    // Add a small delay to ensure canvas is properly initialized
                    setTimeout(() => {
                        const intervalId = setInterval(
                            () => captureAndSendFrame(newSocket),
                            FRAME_INTERVAL_MS
                        );
                        setSendIntervalId(intervalId);
                    }, 500);
                }
            };

            newSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log("Received data:", data);

                    const top = data.top_k_predictions?.[0] || {
                        label: "N/A",
                        probability: 0,
                    };
                    setTopPrediction(top);

                    const newCorrectedSentence =
                        data.corrected_sentence_text || "";
                    setCorrectedSentence(newCorrectedSentence);

                    // Log when corrected sentence changes (including to empty)
                    if (newCorrectedSentence !== correctedSentence) {
                        console.log("Corrected sentence changed:", {
                            from: correctedSentence,
                            to: newCorrectedSentence,
                            isEmpty: newCorrectedSentence === "",
                        });
                    }

                    setProgress({
                        bufferPercentage: data.buffer_fill_percentage || 0,
                        delay: data.is_in_delay,
                        delayProgress: data.delay_progress || 0,
                        queueSize: data.input_queue_actual_size || 0,
                        targetSize: data.input_queue_target_clip_size || 0,
                    });
                } catch (e) {
                    console.error("Error processing message:", e);
                }
            };

            newSocket.onclose = () => {
                console.log("WebSocket disconnected.");
                setIsConnected(false);
                setLocalAiTranslatorStatus(false);
                if (sendIntervalId) {
                    clearInterval(sendIntervalId);
                    setSendIntervalId(null);
                }

                // Only attempt retry if we're still trying to connect
                if (isConnecting && retryCount < MAX_RETRIES) {
                    setConnectionError(
                        `Connection failed. Retrying... (${
                            retryCount + 1
                        }/${MAX_RETRIES})`
                    );
                    retryTimeoutRef.current = setTimeout(() => {
                        connectWebSocket(retryCount + 1);
                    }, RETRY_DELAY);
                }
            };

            newSocket.onerror = (err) => {
                console.error("WebSocket error:", err);
                setIsConnected(false);
                setLocalAiTranslatorStatus(false);
                setConnectionError(
                    "Connection error. Please check if the server is running."
                );
            };

            setSocket(newSocket);
        } catch (err) {
            console.error("Error creating WebSocket:", err);
            setConnectionError("Failed to create WebSocket connection.");
            setIsConnecting(false);
        }
    };

    const disconnectWebSocket = () => {
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
        if (socket) {
            socket.close();
            setSocket(null);
        }
        if (sendIntervalId) {
            clearInterval(sendIntervalId);
            setSendIntervalId(null);
        }
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionError(null);
        setLocalAiTranslatorStatus(false);
    };

    // ============================= Helper Functions =============================
    // Share callId using Web Share API
    const shareCallId = async () => {
        try {
            await navigator.share({
                title: "Video Call Invitation",
                text: `${
                    username || "Someone"
                } invited you to a call via SignLink:\nCall Link: https://sign-link.netlify.app/call/${callId}`,
            });
            showPopup("Invitation shared successfully!", "success");
        } catch (error) {
            if (error.name !== "AbortError") {
                showPopup("Sharing failed", "error");
            }
        }
    };

    // Toggle active video (expand / compress)
    const toggleActiveVideo = (video) => {
        setActiveVideo((prev) => (prev === video ? null : video));
    };

    // Show popup message
    const showPopup = (message, type) => {
        setPopupMessage(message);
        setPopupType(type);
        setTimeout(() => {
            setPopupMessage("");
            setPopupType("");
        }, 2000);
    };

    // Copy Call ID to clipboard
    const copyCallId = () => {
        navigator.clipboard
            .writeText(callId)
            .then(() => showPopup("Call ID copied to clipboard!", "success"))
            .catch(() => showPopup("Failed to copy Call ID!", "error"));
    };

    // Format call duration for endCall popup (X hours, Y minutes, Z seconds)
    const formatDurationForPopup = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const parts = [];

        if (hours > 0) {
            parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
        }

        if (minutes > 0) {
            parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
        }

        if (seconds > 0 || totalSeconds === 0) {
            parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);
        }

        // Format as "X hours, Y minutes and Z seconds"
        if (parts.length === 1) return parts[0];
        return parts.slice(0, -1).join(", ") + " and " + parts.slice(-1);
    };

    // Revert URL to the original state when the call ends
    const revertUrl = () => {
        window.history.replaceState({}, document.title, originalUrl.current);
    };

    // ============================= Media Handlers =============================
    // Toggle video on/off
    const toggleVideo = async () => {
        if (!localStream.current) {
            // Reinitialize the local stream if it's stopped or null
            try {
                localStream.current = await navigator.mediaDevices.getUserMedia(
                    {
                        video: true,
                        audio: true,
                    }
                );
                localVideoRef.current.srcObject = localStream.current;
                setIsCameraOn(true);
            } catch (error) {
                return;
            }
        }

        const videoTrack = localStream.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setIsCameraOn(videoTrack.enabled);
        }
    };

    // Toggle Audio on/off
    const toggleAudio = async () => {
        if (!localStream.current) {
            // Reinitialize the local stream if it's stopped or null
            try {
                localStream.current = await navigator.mediaDevices.getUserMedia(
                    {
                        video: true,
                        audio: true,
                    }
                );
                localVideoRef.current.srcObject = localStream.current;
                setIsAudioMuted(false);
            } catch (error) {
                return;
            }
        }

        const audioTrack = localStream.current.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setIsAudioMuted(!audioTrack.enabled);
        }
    };

    // Share screen
    const shareScreen = async () => {
        try {
            if (isSharingScreen) {
                // Stop screen sharing
                screenStream.current
                    .getTracks()
                    .forEach((track) => track.stop());
                // Restore the local video stream to the webcam
                localVideoRef.current.srcObject = localStream.current;
                // Replace the screen sharing track with the original webcam track in the RTCPeerConnection
                const webcamTrack = localStream.current.getVideoTracks()[0];
                const sender = pc.current
                    .getSenders()
                    .find((sender) => sender.track.kind === "video");
                if (sender) {
                    sender.replaceTrack(webcamTrack); // Replace the track
                }
                setIsSharingScreen(false);
                return;
            }

            // Start screen sharing
            screenStream.current = await navigator.mediaDevices.getDisplayMedia(
                {
                    video: true,
                    audio: true,
                }
            );
            // Replace the local video stream with the screen sharing stream
            localVideoRef.current.srcObject = screenStream.current;
            // Replace the video track in the RTCPeerConnection
            const screenTrack = screenStream.current.getVideoTracks()[0];
            const sender = pc.current
                .getSenders()
                .find((sender) => sender.track.kind === "video");
            if (sender) {
                sender.replaceTrack(screenTrack); // Replace the track
            }
            setIsSharingScreen(true);

            // Handle screen sharing stop (when the user clicks "Stop Sharing" in the browser)
            screenStream.current.getTracks()[0].onended = () => {
                // Restore the local video stream to the webcam
                localVideoRef.current.srcObject = localStream.current;
                // Replace the screen sharing track with the original webcam track in the RTCPeerConnection
                const webcamTrack = localStream.current.getVideoTracks()[0];
                const sender = pc.current
                    .getSenders()
                    .find((sender) => sender.track.kind === "video");
                if (sender) {
                    sender.replaceTrack(webcamTrack); // Replace the track
                }
                setIsSharingScreen(false);
            };
        } catch (error) {
            // console.error("Error sharing screen:", error);
        }
    };

    // ============================= Data Channel Functions =============================
    // Setup data channel for sharing corrected sentence
    const setupDataChannel = () => {
        if (!pc.current) return;

        // Only the creator (offerer) creates the data channel
        if (userType === "creator") {
            try {
                dataChannel.current = pc.current.createDataChannel(
                    "correctedSentence",
                    {
                        ordered: true,
                        maxRetransmits: 3,
                    }
                );

                dataChannel.current.onopen = () => {
                    console.log(`${userType} data channel opened`);
                    setDataChannelStatus("connected");
                };

                dataChannel.current.onclose = () => {
                    console.log(`${userType} data channel closed`);
                    setDataChannelStatus("disconnected");
                };

                dataChannel.current.onerror = (error) => {
                    console.error(`${userType} data channel error:`, error);
                };
            } catch (error) {
                console.error("Error creating data channel:", error);
            }
        }

        // Listen for data channel from remote peer (both creator and joiner)
        pc.current.ondatachannel = (event) => {
            const channel = event.channel;

            if (channel.label === "correctedSentence") {
                // For joiner: this is the main data channel
                // For creator: this is the remote peer's data channel
                if (userType === "guest") {
                    dataChannel.current = channel;
                    console.log(
                        `${userType} received data channel from creator`
                    );
                } else {
                    remoteDataChannel.current = channel;
                    console.log(
                        `${userType} received data channel from joiner`
                    );
                }

                channel.onopen = () => {
                    console.log(`${userType} data channel opened`);
                    setDataChannelStatus("connected");
                };

                channel.onclose = () => {
                    console.log(`${userType} data channel closed`);
                    setDataChannelStatus("disconnected");
                };

                channel.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === "correctedSentence") {
                            const newRemoteSentence = data.sentence || "";
                            setRemoteCorrectedSentence(newRemoteSentence);
                            console.log(
                                "Received corrected sentence from remote:",
                                {
                                    sentence: newRemoteSentence,
                                    isEmpty: newRemoteSentence === "",
                                    timestamp: data.timestamp,
                                }
                            );
                        } else if (data.type === "profileImage") {
                            setRemoteUserProfileImage(data.image);
                            console.log(
                                "Received profile image from remote:",
                                data.image
                            );
                        } else if (data.type === "aiTranslatorStatus") {
                            setRemoteAiTranslatorStatus(data.status);
                            console.log(
                                "Received AI Translator status from remote:",
                                data.status
                            );
                        }
                    } catch (error) {
                        console.error(
                            "Error parsing data channel message:",
                            error
                        );
                    }
                };

                channel.onerror = (error) => {
                    console.error("Data channel error:", error);
                };
            }
        };
    };

    return (
        <div className="Call-Page bg-gray-900 min-h-screen">
            {/* ===================== Call Duration Display ===================== */}
            {callStartTime && (
                <CallDuration
                    startTime={callStartTime}
                    currentTime={currentTime}
                />
            )}

            {/* ===================== Participants Count Display ===================== */}
            {callId && (
                <ParticipantCount
                    count={participantCount}
                    max={maxParticipants}
                />
            )}

            {/* ===================== Popup ===================== */}
            <NotificationPopup message={popupMessage} type={popupType} />

            {/* ===================== Video Container ===================== */}
            <div
                className="video-container overflow-x-hidden overflow-y-auto mx-auto"
                style={{ maxWidth: `${activeVideo ? "90%" : "100%"}` }}
            >
                {/* Call Header */}
                {callId && (
                    <CallHeader
                        callId={callId}
                        onCopy={copyCallId}
                        onShare={shareCallId}
                        showShare={isWebShareSupported}
                    />
                )}

                {/* Video Streams */}
                <div className="container my-12 mb-28">
                    {/* Local Video */}
                    <VideoStream
                        videoRef={localVideoRef}
                        canvasRef={localCanvasRef}
                        username={username || "You"}
                        isActive={activeVideo === "local"}
                        onExpandToggle={() => toggleActiveVideo("local")}
                        delayWidth={isConnected ? delayWidth : undefined}
                        bufferWidth={isConnected ? bufferWidth : undefined}
                        progressText={isConnected ? progressText : undefined}
                        correctedSentence={correctedSentence}
                        aiTranslatorStatus={localAiTranslatorStatus}
                    />

                    {/* Remote Video */}
                    <VideoStream
                        videoRef={remoteVideoRef}
                        username={participantUsername}
                        isActive={activeVideo === "remote"}
                        onExpandToggle={() => toggleActiveVideo("remote")}
                        isRemote
                        correctedSentence={remoteCorrectedSentence}
                        aiTranslatorStatus={remoteAiTranslatorStatus}
                        style={{
                            height: `${isRemoteExists ? "auto" : "0px"}`,
                            border: `${
                                isRemoteExists ? "5px solid #1d263a" : "0px"
                            }`,
                        }}
                    />
                </div>

                {/* Prediction Info */}
                {showPrediction && (
                    <PredictionInfo
                        topPrediction={topPrediction}
                        getConfidenceClass={getConfidenceClass}
                    />
                )}
            </div>

            {/* Floating Gear (Settings) */}
            <FloatingGear onClick={() => setIsSettingsOpen(true)} />

            {/* Floating Chat Toggle Button */}
            {!isChatVisible && (
                <button
                    className="fixed top-[4.5rem] right-4 z-40 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                    onClick={() => setIsChatVisible(true)}
                    title="Open Chat"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                    </svg>
                </button>
            )}

            <SettingsPopup
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                isConnected={isConnected}
                isConnecting={isConnecting}
                connectionError={connectionError}
                onToggleConnection={handleToggleConnection}
                showPrediction={showPrediction}
                onTogglePrediction={() => setShowPrediction(!showPrediction)}
                showSubtitles={showSubtitles}
                onToggleSubtitles={() => setShowSubtitles(!showSubtitles)}
                isChatVisible={isChatVisible}
                onToggleChat={() => setIsChatVisible(!isChatVisible)}
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
            />

            {/* ===================== Call Chat ===================== */}
            <CallChat
                senderProfileImage={remoteUserProfileImage}
                isVisible={isChatVisible}
                onClose={() => setIsChatVisible(false)}
                isConnected={isConnected}
            />

            {/* ===================== Video/Audio Controls ===================== */}
            <div className="media-controls bg-gray-800 py-[1rem] fixed left-0 bottom-0 w-full">
                <div className="container">
                    <ToggleCameraButton
                        isOn={isCameraOn}
                        onClick={toggleVideo}
                    />
                    <ToggleAudioButton
                        isMuted={isAudioMuted}
                        onClick={toggleAudio}
                    />
                    <ScreenShareButton
                        isSharing={isSharingScreen}
                        onClick={shareScreen}
                    />

                    {/* Leave/End Call Button */}
                    {isCallCreator ? (
                        <EndCallButton onClick={endCall} />
                    ) : (
                        (isRemoteExists || isTimeOut) && (
                            <LeaveCallButton onClick={leaveCall} />
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallPage;
