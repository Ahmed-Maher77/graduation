import React, { useEffect, useState } from "react";
import { useLocation, Outlet, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import MainLoader from "../../components/Loader/MainLoader";
import UpToTop_Button from "../../components/UpToTop_Button/UpToTop_Button";
import { useDispatch, useSelector } from "react-redux";
import Footer from "../Footer/Footer.jsx";
import api, {
	decodeToken,
	encodeToken,
	setGlobalNavigate,
} from "../../utils/custom_hooks/api/axiosConfig.js";
import Cookies from "js-cookie";
import { setIsAuth } from "../../utils/redux-toolkit/apiSlice.js";
import { setIsLargeScreen } from "../../utils/redux-toolkit/windowScreen.js";
import axios from "axios";
import Swal from "sweetalert2";

const Layout = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const isAuth = useSelector((state) => state.api.isAuth);
	const { username, image } = useSelector((state) => state.api.userData);

	const validRoutes = [
		"/",
		"/about",
		"/login",
		"/meeting",
		"/contact",
		"/profile",
	];
	const { pathname } = useLocation();
	const showNavbar = validRoutes.includes(pathname);
	const [showLoader, setShowLoader] = useState(true);

	useEffect(() => {
		sessionStorage.setItem("comingFromCallPage", false);
	}, []);

	useEffect(() => {
		const timeId = setTimeout(() => {
			setShowLoader(false);
		}, 1500);
		// Clear timeout on unmount
		return () => clearTimeout(timeId);
	}, []);

	useEffect(() => {
		setGlobalNavigate(navigate);
	}, [navigate]);

	useEffect(() => {
		const checkAuth = async () => {
			const token = Cookies.get("accessToken"); // edit
			if (token) {
				dispatch(setIsAuth(true));
			} else {
				try {
					const refreshToken = Cookies.get("refreshToken"); // edit

					if (!refreshToken) throw new Error("No refresh token");

					const response = await api.post("/Auth/refresh", {
						refreshToken: decodeToken(refreshToken),
					});

					if (response.data.accessToken) {
						const accessTokenExpiration = response.data?.accessTokenExpiration
							? new Date(response.data.accessTokenExpiration)
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
							encodeToken(response.data.accessToken),
							accessTokenOptions
						); // edit
					}
					if (response.data.refreshToken) {
						const refreshTokenExpiration = response.data?.refreshTokenExpiration
							? new Date(response.data.refreshTokenExpiration)
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
							encodeToken(response.data.refreshToken),
							refreshTokenOptions
						); // edit
					}
					dispatch(setIsAuth(true));
				} catch (error) {
					console.error("Refresh token failed:", error);
					const refreshToken = Cookies.get("refreshToken"); // edit
					if (refreshToken) {
						Swal.fire({
							title: "Session Expired",
							text: "Please log in again.",
							icon: "warning",
							confirmButtonText: "Go to Login",
							allowOutsideClick: false,
							allowEscapeKey: false,
						}).then(() => {
							navigate("/login", { state: { from: pathname } });
						});
						dispatch(setIsAuth(false));
						Cookies.remove("accessToken");
						Cookies.remove("refreshToken");
					}
					//   navigate("/login", { state: { from: pathname } });       // uncomment => redirect to login page automatically
				}
			}
		};

		checkAuth();
	}, [pathname, dispatch, navigate]);

	useEffect(() => {
		const handleResize = () => {
			dispatch(setIsLargeScreen(window.innerWidth > 1024));
		};
		window.addEventListener("resize", handleResize);
		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	return (
		<>
			{showLoader ? (
				<MainLoader />
			) : (
				<>
					{showNavbar && <Navbar />}
					{showNavbar && <UpToTop_Button />}

					<Outlet />

					{showNavbar && <Footer />}
				</>
			)}
		</>
	);
};

export default Layout;
