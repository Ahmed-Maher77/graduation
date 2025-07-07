import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axiosConfig";

const useUpdateUserImage = (userId) => {
	const queryClient = useQueryClient();
	const { mutateAsync, isPending, error, data } = useMutation({
		mutationFn: (newImage) => {
			return api.put(`/Users/update-user-image/${userId}`, newImage);
		},

		onSuccess: (data) => {
			queryClient.invalidateQueries(["userImage"]);
		},

		onError: (error, newUser, context) => {
			// console.error("Error updating the image:", error.message);
		},
	});
	return { mutateAsync, isPending, error, data };
};
export default useUpdateUserImage;
