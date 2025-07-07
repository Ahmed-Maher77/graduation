import { FaShare } from "react-icons/fa";

export const CallHeader = ({ callId, onCopy, onShare, showShare }) => (
	<div className="call-id-container flex gap-4 lg:gap-6 items-center justify-center flex-wrap px-3">
        {/* Call ID */}
        <span className="text-lg text-[#d1d1d1]">
			<b className="text-xl text-white me-1 max-lg:text-[1rem]">Call ID:</b> {callId}
		</span>

		<div className="call-id-buttons">
            {/* Copy Button */}
			<button onClick={onCopy} className="copy-button button popover" title="Copy Call ID">
				<span className="fa-solid fa-copy"></span>
			</button>

            {/* Share Button */}
			{showShare && (
				<button onClick={onShare} className="share-button button" title="Share Call ID">
					<FaShare />
				</button>
			)}
		</div>
	</div>
);
