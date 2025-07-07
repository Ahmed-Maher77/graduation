import React, { useState } from "react";
import { useSelector } from "react-redux";
import useFetchUserImage from "../../../utils/custom_hooks/userData/useFetchUserImage";

const ChatMessage = ({
    messageContent,
    senderName,
    timestamp,
    type,
    isMyMessage,
    senderProfileImage,
}) => {
    const { username, image, userId } = useSelector(
        (state) => state.api.userData
    );
    const { data, isLoading, error } = useFetchUserImage(userId, image);
    const myProfileImage = data?.photoUrl || null;
    const profileImage = isMyMessage ? myProfileImage : senderProfileImage;
    const msgtimestamp = new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    // State to track if image failed to load
    const [imageError, setImageError] = useState(false);

    // Get first character of username for fallback
    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : "?";
    };

    // Generate a consistent color based on username
    const getAvatarColor = (name) => {
        if (!name) return "#6b7280";
        const colors = [
            "#ef4444",
            "#f97316",
            "#eab308",
            "#22c55e",
            "#06b6d4",
            "#3b82f6",
            "#8b5cf6",
            "#ec4899",
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <section className={`ChatMessage w-full flex ${isMyMessage? "justify-end" : "justify-start"}`}>
            <div className={`w-fit p-2 rounded-lg flex gap-[10px] ${isMyMessage ? "flex-row-reverse" : "flex-row"}`}>
                {/* =============== sender profile image =============== */}
                {profileImage && !imageError ? (
                    <img
                        className="min-w-[40px] min-h-[40px] w-[40px] h-[40px] rounded-full object-cover"
                        src={profileImage}
                        alt={`${senderName} profile image`}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div
                        className="min-w-[40px] min-h-[40px] w-[40px] h-[40px] rounded-full flex items-center justify-center text-white font-semibold text-lg fallback-avatar"
                        style={{ backgroundColor: getAvatarColor(senderName) }}
                    >
                        {getInitial(senderName)}
                    </div>
                )}

                {/* =============== message body =============== */}
                <div className="message-body relative">
                    {/* message header */}
                    <header className={`${isMyMessage ? "text-end" : "text-start"}`}>
                        <span
                            className={`senderName ${
                                isMyMessage
                                    ? "text-stone-700"
                                    : "text-green-600"
                            } font-medium text-sm`}
                        >
                            {senderName}
                        </span>
                    </header>
                    {/* message text */}
                    <div
                        className={`message-text p-[8px] rounded-[6px] text-white ${
                            isMyMessage ? "bg-blue-600" : "bg-gray-600"
                        }`}
                    >
                        {messageContent}
                    </div>
                    {/* message type */}
                    <footer className={`message-type bg-transparent p-[0.2rem] text-black text-[10px] flex justify-between items-center gap-2`}>
                        <span className="text-xs font-medium">{type === "signToText"? "Sign-to-Text" : "Regular-Text"}</span>
                        <span className="timestamp text-xs text-gray-700">
                            {msgtimestamp}
                        </span>
                    </footer>
                </div>
            </div>
        </section>
    );
};

export default ChatMessage;
