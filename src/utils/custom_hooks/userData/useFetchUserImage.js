import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import api from "../api/axiosConfig";


function useFetchUserImage(id, imagePath) {
	const fetchUserImage = async () => {
		try {
			const res = await api.get(`/Users/${id}/photo-path`);
			return res.data;
		} catch (error) {
			throw new Error(
				"An Error occured while fetching the user's picture: " + error.message
			);
		}
	};
	const { data, isLoading, error } = useQuery({
		queryKey: ["userImage", id],
		queryFn: fetchUserImage,
		staleTime: 10000,
		enabled: !!id, // Ensures the query runs only if `id` is provided >> !! to ensure it is a boolean value
	});
	return { data, isLoading, error: error?.message };
}
export default useFetchUserImage;
