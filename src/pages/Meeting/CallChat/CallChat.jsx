import React, { useState } from "react";
import ChatMessages from "./ChatMessages";
import "./CallChat.scss";

const chats_dummy_data = [
    {
        message: "Hello, how are you?",
        type: "regularMsg",
        senderName: "Ahmed Maher",
        timestamp: "2024-06-24T14:01:00Z",
    },
    {
        message: "I'm good, and you?",
        type: "regularMsg",
        senderName: "Faysal",
        timestamp: "2024-06-24T14:01:10Z",
    },
    {
        message: "I'm good, thank you",
        type: "regularMsg",
        senderName: "Ahmed Maher",
        timestamp: "2024-06-24T14:01:25Z",
    },
    {
        message: "Do you like apples?",
        type: "regularMsg",
        senderName: "Faysal",
        timestamp: "2024-06-24T14:01:35Z",
    },
    {
        message: "Yes I like apples",
        type: "signToText",
        senderName: "Faysal",
        timestamp: "2024-06-24T14:01:50Z",
    },
    {
        message: "Cool",
        type: "regularMsg",
        senderName: "Ahmed Maher",
        timestamp: "2024-06-24T14:02:00Z",
    },
];

const CallChat = ({ senderProfileImage, isVisible, onClose, isConnected }) => {
    const [inputValue, setInputValue] = useState("");

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleSendMessage = () => {
        if (inputValue.trim() !== "") {
            // TODO: Add logic to send message
            console.log("Sending message:", inputValue);
            setInputValue("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const isSendButtonDisabled = inputValue.trim() === "";

    return (
        <div
            className={`call-chat-sidebar ${isVisible ? "visible" : "hidden"}`}
        >
            <main className="CallChat w-[300px] lg:w-[350px] h-full bg-white shadow-lg fixed right-0 top-0 flex flex-col gap-2 z-50">
                {/* ===================== Chat Header ===================== */}
                <header className="flex justify-between items-center p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-800">
                            Call Chat
                        </h3>
                        {!isConnected && (
                            <i className="fas fa-wifi-slash text-red-500 text-sm"></i>
                        )}
                    </div>
                    <button
                        className="close-icon text-2xl text-red-500 hover:text-red-700 transition-colors duration-200"
                        title="Close Chat"
                        onClick={onClose}
                    >
                        &#10005;
                    </button>
                </header>

                {/* ===================== Chat Messages ===================== */}
                <ChatMessages
                    messages={chats_dummy_data}
                    senderProfileImage={senderProfileImage}
                />

                {/* ===================== Chat Input ===================== */}
                <form
                    className="chat-input-container p-4 border-t border-gray-200"
                    onSubmit={handleSendMessage}
                >
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isSendButtonDisabled}
                            className={`send-button p-2 rounded-lg transition-all duration-200 ${
                                isSendButtonDisabled
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                            }`}
                            title={
                                isSendButtonDisabled
                                    ? "Type a message to send"
                                    : "Send message"
                            }
                        >
                            <i className="fas fa-paper-plane text-sm"></i>
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default CallChat;
