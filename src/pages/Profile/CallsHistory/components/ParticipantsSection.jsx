import React from "react";
import { formatTime } from "../utils/dateUtils";
import "./ParticipantsSection.scss";

const ParticipantsSection = ({ participants }) => {
    return (
        <div className="participants-section">
            <h4>Participants</h4>
            <div className="participants-list">
                {participants.map((participant, index) => (
                    <div key={index} className="participant-item">
                        <div className="participant-info">
                            <div className="participant-name">{participant.name}</div>
                            <div className="participant-email">{participant.email}</div>
                        </div>
                        <div className="participant-times">
                            <div className="join-time">
                                Joined: {formatTime(participant.joinTime)}
                            </div>
                            {participant.leavingTime && (
                                <div className="leave-time">
                                    Left: {formatTime(participant.leavingTime)}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ParticipantsSection; 