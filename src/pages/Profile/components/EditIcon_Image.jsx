import { toast } from "react-toastify";
import useUpdateUserImage from "../../../utils/custom_hooks/api/useUpdateUserImage";
import EditImage_Loader from "./EditImage_Loader";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useEffect } from "react";

const EditIcon_Image = () => {
	const userId = useSelector((state) => state.api.userData.userId);
	const { mutateAsync, isPending, error, data } = useUpdateUserImage(userId);
	const queryClient = useQueryClient();

	useEffect(() => {
		if (error) {
			toast.error("Error updating image: " + error.message);
		}
	}, [error]);

	const updateImage = async () => {
		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = "image/*";
		fileInput.click();
		fileInput.onchange = async () => {
			try {
				const file = fileInput.files[0];
				const formData = new FormData();
				formData.append("Image", file);
				await mutateAsync(formData);
				toast.success("Image updated successfully!");
			} catch (err) {
				console.error("Error in updateImage:", err);
			}
		};
	};

	if (isPending) {
		return <EditImage_Loader />;
	}

	return (
		<div
			className="edit-icon w-[38px] h-[38px] absolute top-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-200 transition duration-300 ease-in-out flex items-center justify-center"
			onClick={updateImage}
		>
			<i className="fas fa-edit text-gray-600"></i>
		</div>
	);
};

export default EditIcon_Image;
