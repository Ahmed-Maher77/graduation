import axios from "axios";
import Cookies from "js-cookie";
import { setIsAuth } from "../../redux-toolkit/apiSlice";
import { store } from "../../redux-toolkit/store";

let globalNavigate;

export const setGlobalNavigate = (navigate) => {
	globalNavigate = navigate;
};

// Encoding/Decoding functions
export const encodeToken = (token) => btoa(token);
export const decodeToken = (encodedToken) => {
	try {
		return atob(encodedToken);
	} catch (error) {
		console.error("Invalid token format");
		return null;
	}
};

const api = axios.create({
	baseURL: import.meta.env.VITE_BACKEND_BASE_URL, // edit
	withCredentials: true,
});

// Request interceptor to add access token
api.interceptors.request.use((config) => {
	const encodedToken = Cookies.get("accessToken"); // edit
	if (encodedToken) {
		const token = decodeToken(encodedToken);
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
	}
	return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		// Skip refresh for these endpoints
		if (
			(error.response?.status === 401 || error.response?.status === 403) &&
			!["/Auth/refresh", "/Auth/logout"].includes(originalRequest.url) // edit
		) {
			try {
				const refreshToken = Cookies.get("refreshToken");
				if (!refreshToken) throw new Error("No refresh token");
				// ========================= According to the Bckend API, hoose ONE of these =========================
				// Option 1: If backend uses cookie-based refresh tokens [doesn't require a refresh token in the body]
				// const refreshResponse = await api.post("/Auth/refresh");
				// Option 2: If backend needs refresh token in body
				const refreshResponse = await api.post("/Auth/refresh", {
					// edit
					refreshToken: decodeToken(refreshToken),
				});
				// Option 3: If backend needs header-based refresh token [requires a refresh token in the headers]
				// const refreshResponse = await api.post("/Auth/refresh", {}, {
				// 	headers: {
				// 		"X-Refresh-Token": Cookies.get("refreshToken")
				// 	}
				// });
				// ==================================================================================================

				// Access Token
				if (refreshResponse.data.accessToken) {
					const accessTokenExpiration = refreshResponse.data
						?.accessTokenExpiration
						? new Date(refreshResponse.data.accessTokenExpiration)
						: null;
					const accessTokenOptions = {
						sameSite: "Lax", // if the baseUrl HTTPs => sameSite: "Strict",
						// secure: import.meta.env.VITE_NODE_ENV === "production", // Uncomment if the baseUrl HTTPs
					};
					if (accessTokenExpiration) {
						accessTokenOptions.expires = accessTokenExpiration;
					}
					Cookies.set(
						"accessToken",
						encodeToken(refreshResponse.data.accessToken),
						accessTokenOptions
					); // edit
				}

				// Refresh Token
				if (refreshResponse.data.refreshToken) {
					const refreshTokenExpiration = refreshResponse.data
						?.refreshTokenExpiration
						? new Date(refreshResponse.data.refreshTokenExpiration)
						: null;
					const refreshTokenOptions = {
						sameSite: "Lax",
						// secure: import.meta.env.VITE_NODE_ENV === "production",                // if the baseUrl HTTPs
					};
					if (refreshTokenExpiration) {
						refreshTokenOptions.expires = refreshTokenExpiration;
					}
					Cookies.set(
						"refreshToken",
						encodeToken(refreshResponse.data.refreshToken),
						refreshTokenOptions
					); // edit
				}

				// Retry the original request with new token
				return api(originalRequest);
			} catch (refreshError) {
				// If refresh failed → logout
				Cookies.remove("accessToken");
				Cookies.remove("refreshToken");
				store.dispatch(setIsAuth(false));
				Swal.fire({
					title: "Session Expired",
					text: "Please log in again.",
					icon: "warning",
					confirmButtonText: "Go to Login",
					allowOutsideClick: false,
					allowEscapeKey: false,
				}).then(() => {
					if (globalNavigate) {
						globalNavigate("/login");
					} else {
						window.location.href = "/login";
					}
				});

				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	}
);

export default api;
