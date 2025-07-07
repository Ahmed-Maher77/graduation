import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./axiosConfig";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { useDispatch } from "react-redux";
import { setIsAuth, setUserData } from "../../redux-toolkit/apiSlice";
import { useLocation, useNavigate } from "react-router-dom";

const encodeToken = (token) => btoa(token);

const loginUser = async (userData) => {
	try {
		const res = await api.post("/Auth/login", userData);        // edit
		return res.data;
	} catch (error) {
		console.log("Error in loginUser:", error);
		
		const res = error.response;
		const rawData = res?.data;

		let message = error?.message || "Something went wrong";
		
		let fieldErrors = {};

		if (typeof rawData === "string") {
			// Case: backend returns a plain string error
			message = rawData;
			if (message.toLowerCase().includes("email")) {    // edit
				fieldErrors.Email = message;                  // edit
			} else if (message.toLowerCase().includes("password")) { // edit
				fieldErrors.Password = message;               // edit
			}
		} else if (typeof rawData === "object" && rawData !== null) {
			if (rawData.message && typeof rawData.message === "string") {
				message = rawData.message || rawData?.error || "Something went wrong";
			}
			if (rawData.errors && typeof rawData.errors === "object") {
				fieldErrors = rawData.errors;
			} else if (Array.isArray(rawData.errors)) {
				rawData.errors.forEach((err) => {
					if (err.field && err.message) {
						fieldErrors[err.field] = err.message;
					}
				});
			}
			else if (rawData.error && typeof rawData.error === "string") {
				message = rawData.error;
			}
		}

		const customError = new Error(message);
		customError.errors = fieldErrors;
		throw customError;
	}
};


const useLogin = () => {
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const { state } = useLocation();
	const navigate = useNavigate();
	const redirectTo = state?.from || "/";

	const setTokenCookie = (name, token, expires = null) => {
		Cookies.set(name, encodeToken(token), {
			expires: expires ? new Date(expires) : undefined,
			sameSite: "Lax",          	 // if the baseUrl HTTPs => sameSite: "Strict", [To prevent CSRF attacks]
			path: "/",                   // Available everywhere
			// secure: import.meta.env.VITE_NODE_ENV === "production",     // if the baseUrl HTTPs
		});
	};

	return useMutation({
		mutationFn: loginUser,
		onSuccess: (data) => {
			if (data.accessToken) {
				setTokenCookie("accessToken", data.accessToken, data.accessTokenExpiration);
				// queryClient.invalidateQueries(["currentUser"]);
			}
			if (!!data.refreshToken) {
				setTokenCookie("refreshToken", data.refreshToken);
			}

			console.log("successful login: ", data);
			const userData = {
				username: data.username,
				email: data.email,
				image: data.image,
				userId: data.userId,
			};
			dispatch(setUserData(userData));
			dispatch(setIsAuth(true));

			Swal.fire({
				title: "Welcome back!",
				text: "You have logged in successfully.",
				icon: "success",
				timer: 2000,
				showConfirmButton: false,
				timerProgressBar: true,
			}).then(() => {
				navigate(redirectTo, { replace: true });
			});
		},
		onError: (error) => {
			// Only show alert for non-field errors
			if (!Object.keys(error.errors || {}).length) {
				console.log("Login Failed:", error.response?.data?.message || error.message);
				dispatch(setIsAuth(false));
			}
		},
	});
};
export default useLogin;


