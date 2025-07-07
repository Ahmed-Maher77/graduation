import React, { useEffect, useState } from "react";
import "./Login.scss";
import useValidationSchema_SignUp from "../../utils/custom_hooks/useValidationSchema_SignUp.jsx";
import useValidationSchema_SignIn from "../../utils/custom_hooks/useValidationSchema_SignIn.js";
import { stopCamera } from "../../utils/functions/stopCamera.js";
import SignUpForm from "./components/SignUpForm";
import SignInForm from "./components/SignInForm";

const Login = () => {
	const [isSignUp, setIsSignUp] = useState(true);
	const formik = useValidationSchema_SignUp();
	const formikSignIn = useValidationSchema_SignIn();
	const [showLoginPassword, setShowLoginPassword] = useState(false);
	const [showSignUpPassword, setShowSignUpPassword] = useState(false);
	const [previewImage, setPreviewImage] = useState(null);

	useEffect(() => {
		stopCamera();
	}, []);

	const handleInput = (e) => {
		if (isSignUp) {
			formik.handleChange(e);
		} else {
			formikSignIn.handleChange(e);
		}
	};

	const handleSignUpClick = () => {
		setIsSignUp(true);
	};

	const handleSignInClick = () => {
		setIsSignUp(false);
	};

	return (
		<div className="Login-Page overflow-hidden">
			<div className="login-container py-12">
				<div
					className={`wrapper ${
						isSignUp ? "animate-signIn" : "animate-signUp"
					}`}
				>
					<SignUpForm
						formik={formik}
						handleInput={handleInput}
						showSignUpPassword={showSignUpPassword}
						setShowSignUpPassword={setShowSignUpPassword}
						previewImage={previewImage}
						setPreviewImage={setPreviewImage}
						onSignInClick={handleSignInClick}
					/>

					<SignInForm
						formik={formikSignIn}
						handleInput={handleInput}
						showLoginPassword={showLoginPassword}
						setShowLoginPassword={setShowLoginPassword}
						onSignUpClick={handleSignUpClick}
					/>
				</div>
			</div>
		</div>
	);
};

export default Login;
