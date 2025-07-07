import React from "react";
import { formatDate } from "../utils/dateUtils";
import "./CallTimeline.scss";

const CallTimeline = ({ call }) => {
    return (
        <div className="call-timeline">
            <h4>Call Timeline</h4>
            <div className="timeline">
                <div className="timeline-item">
                    <div className="timeline-marker start"></div>
                    <div className="timeline-content">
                        <div className="timeline-title">Call Started</div>
                        <div className="timeline-time">{formatDate(call.startTime)}</div>
                    </div>
                </div>
                {call.endTime && (
                    <div className="timeline-item">
                        <div className="timeline-marker end"></div>
                        <div className="timeline-content">
                            <div className="timeline-title">Call Ended</div>
                            <div className="timeline-time">{formatDate(call.endTime)}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CallTimeline; 