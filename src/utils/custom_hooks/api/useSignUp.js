import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./axiosConfig";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { useDispatch } from "react-redux";
import { setIsAuth, setUserData } from "../../redux-toolkit/apiSlice";
import { useLocation, useNavigate } from "react-router-dom";

const encodeToken = (token) => btoa(token);

const signUpUser = async (userData) => {
	try {
		const formData = new FormData();          // edit (according to the backend which format it accepts)
		formData.append("Username", userData.Username);
		formData.append("Email", userData.Email);
		formData.append("Password", userData.Password);
		formData.append("Image", userData.Image); // file object!


		const res = await api.post("/Auth/register", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});             // edit
		return res.data;
	} catch (error) {
		console.log("Error in signUpUser:", error);
	
		const res = error.response;
		const rawData = res?.data;
	
		let message = error?.message || "Something went wrong";
		let fieldErrors = {};
	
		if (typeof rawData === "string") {
			// Case: backend returns a plain string error
			message = rawData;
			if (message.toLowerCase().includes("username")) {      // edit
				fieldErrors.Username = message;                    // edit
			} else if (message.toLowerCase().includes("email")) {  // edit
				fieldErrors.Email = message;                      // edit
			} else if (message.toLowerCase().includes("password")) { // edit
				fieldErrors.Password = message;                   // edit
			}
		} else if (typeof rawData === "object" && rawData !== null) {
			// Case: backend returns an object (e.g., { message, errors })
			if (rawData.message && typeof rawData.message === "string") {
				message = rawData.message || rawData?.error || "Something went wrong";
			}
			if (rawData.errors && typeof rawData.errors === "object") {
				fieldErrors = rawData.errors;
			} else if (Array.isArray(rawData.errors)) {
				// If errors is an array like [{ field: "Username", message: "Already taken" }]
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

const useSignUp = () => {
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
		mutationFn: signUpUser,
		onSuccess: (data) => {
			if (data.accessToken) {
				setTokenCookie("accessToken", data.accessToken, data.accessTokenExpiration);
				// queryClient.invalidateQueries(["currentUser"]);
			}
			if (!!data.refreshToken) {
				setTokenCookie("refreshToken", data.refreshToken);
			}	

			console.log("Successful signup:", data);
			const userData = {
				username: data.username,
				email: data.email,
				image: data.image,
				userId: data.userId,
			};
			dispatch(setUserData(userData));
			dispatch(setIsAuth(true));

			Swal.fire({
				title: "Welcome!",
				text: "Your account has been created successfully.",
				icon: "success",
				timer: 2000,
				showConfirmButton: false,
				timerProgressBar: true,
			}).then(() => {
				navigate(redirectTo, { replace: true });
			});
		},
		onError: (error) => {
			console.log("Error --:", error);
			dispatch(setIsAuth(false));
			if (!error.errors || Object.keys(error.errors).length === 0) {
				console.error("Signup Failed:", error.message);
				Swal.fire("Error", error.message, "error");
			} else {
				console.error("Validation Errors:", error.errors);
				// Optionally show a generic alert:
				Swal.fire("Form Error", "Please check the highlighted fields.", "warning");
			}
		},
		
	});
};

export default useSignUp;

