import React from "react";

const ProfileDetail = ({ label, value, isMonospace = false }) => {
	return (
		<div className="detail-group">
			<label className="block text-sm font-medium text-gray-600 mb-1">
				{label}
			</label>
			<div
				className={`p-3 bg-gray-50 rounded-lg text-gray-800 ${
					isMonospace ? "font-mono" : ""
				}`}
			>
				{value}
			</div>
		</div>
	);
};

export default ProfileDetail;
