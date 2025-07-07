import React from "react";
import useFetchUserImage from "../../../utils/custom_hooks/userData/useFetchUserImage";
import EditIcon_Image from "./EditIcon_Image";

const ProfileImage = ({ userId, image, username }) => {
	const { data, isLoading } = useFetchUserImage(userId, image);

	const getUsernameLetter = () => {
		const firstLetter = username?.trim()[0]?.toUpperCase();
		return firstLetter || "?";
	};

	return (
		<div className="profile-image-container mx-auto mb-4">
			{image && data?.photoUrl && !isLoading ? (
				<img
					src={data.photoUrl}
					alt={`${username}'s profile`}
					className="w-[7rem] h-[7rem] rounded-full object-cover border-4 border-main"
					onError={(e) => {
						e.target.style.display = "none";
						e.target.nextElementSibling.style.display = "flex";
					}}
				/>
			) : (
				<div className="profile-icon w-[7rem] h-[7rem] rounded-full flex items-center justify-center text-4xl font-bold bg-main text-white">
					{getUsernameLetter()}
				</div>
			)}

			<EditIcon_Image />
		</div>
	);
};

export default ProfileImage;
