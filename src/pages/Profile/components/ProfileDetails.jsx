import React from "react";
import ProfileDetail from "./ProfileDetail";

const ProfileDetails = ({ username, email, userId }) => {
	return (
		<div className="profile-details space-y-6">
			<ProfileDetail label="Username" value={username} />
			<ProfileDetail label="Email" value={email} />
			<ProfileDetail label="User ID" value={userId} isMonospace={true} />
		</div>
	);
};

export default ProfileDetails;
