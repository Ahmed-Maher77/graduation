import React from "react";
import { formatTime } from "../utils/dateUtils";
import "./ChatSection.scss";

const ChatSection = ({ chat }) => {
    return (
        <div className="chat-section">
            <h4>Chat Messages ({chat.length})</h4>
            <div className="chat-messages">
                {chat.map((message, index) => (
                    <div key={index} className={`chat-message ${message.type}`}>
                        <div className="message-header">
                            <span className="sender-name">
                                {message.senderName}
                            </span>
                            <span className="message-type">
                                {message.type === "signToText"
                                    ? "🤟 Sign to Text"
                                    : "💬 Text"}
                            </span>
                            <span className="message-time">
                                {formatTime(message.timestamp)}
                            </span>
                        </div>
                        <div className="message-content">{message.message}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatSection;
