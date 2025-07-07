import React from "react";
import ChatMessage from "./ChatMessage";
import { useSelector } from "react-redux";

const ChatMessages = ({ messages, senderProfileImage }) => {
    const myUsername = useSelector((state) => state.api.userData.username);
    const isMyMessage = (message) => {
        return message.senderName.toLowerCase() === myUsername.toLowerCase();
    };

    return (
        <div className="ChatMessages flex flex-col gap-2 p-4 pb-10 overflow-y-auto h-full">
            {messages.map((message, index) => (
                <div key={index} className="message">
                    <ChatMessage
                        messageContent={message.message}
                        senderName={message.senderName}
                        timestamp={message.timestamp}
                        type={message.type}
                        isMyMessage={isMyMessage(message)}
                        senderProfileImage={senderProfileImage}
                    />
                </div>
            ))}
        </div>
    );
};

export default ChatMessages;
