import React from "react";
import ProfileImage from "./ProfileImage";

const ProfileHeader = ({ username, userId, image }) => {
	return (
		<div className="profile-header text-center mb-8">
			<ProfileImage username={username} userId={userId} image={image} />
			<h1 className="text-2xl font-bold text-gray-800">{username}</h1>
		</div>
	);
};

export default ProfileHeader;
