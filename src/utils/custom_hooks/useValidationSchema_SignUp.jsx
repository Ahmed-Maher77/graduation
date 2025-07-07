import { useFormik } from "formik";
import * as Yup from "yup";
import useSignUp from "./api/useSignUp";

const signUpSchema = Yup.object().shape({
	Username: Yup.string()
		.matches(
			/^[A-Za-z][A-Za-z0-9_ \-!@#$%^&*()+=]*$/,
			"Username must start with a letter and can only contain letters, numbers, spaces, and special characters (like -!@#$%^&*())"
		)
		.min(2, "Too short!")
		.max(50, "Too long!")
		.required("Username is required"),
	Email: Yup.string()
		.email("Enter a valid email")
		.matches(
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/,
			"Enter a valid email with a top-level domain (e.g., .com, .net)"
		)
		.required("Email is required"),
	Password: Yup.string()
		.min(8, "Password must be at least 8 characters")
		.required("Password is required")
		.matches(
			/[a-z]/,
			"Password must contain at least one lowercase letter ('a'-'z')"
		)
		.matches(
			/[A-Z]/,
			"Password must contain at least one uppercase letter ('A'-'Z')"
		)
		.matches(
			/[^a-zA-Z0-9]/,
			"Password must contain at least one non-alphanumeric character"
		),
	Image: Yup.mixed()
		.required("Image is required")
		.test("fileSize", "File size is too large", (value) => {
			if (!value) return false; // No file selected, fail validation
			return value.size <= 2 * 1024 * 1024; // 2MB limit
		})
		.test("fileType", "Unsupported file format", (value) => {
			if (!value) return false; // No file selected, fail validation
			return ["image/jpeg", "image/png", "image/jpg"].includes(value.type);
		}),
});

const useValidationSchema_SignUp = () => {
	const { mutate: handleSignUp, isLoading } = useSignUp();

	const formikSignUp = useFormik({
		initialValues: {
			Username: "",
			Email: "",
			Password: "",
			Image: "",
		},
		validationSchema: signUpSchema,
		validateOnBlur: true,
		validateOnChange: true,
		onSubmit: (values, { resetForm, setSubmitting, setFieldError }) => {
			handleSignUp(values, {
				onSuccess: () => {
					resetForm();
				},
				onError: (error) => {
					console.log("Error object:", error);

					// Handle field-specific errors
					if (error.errors) {
						Object.entries(error.errors).forEach(([field, message]) => {
							const normalizedField =
								field.charAt(0).toUpperCase() + field.slice(1);
							setFieldError(
								normalizedField,
								Array.isArray(message) ? message[0] : message
							);
						});
					}
					// Handle single error message (not field-specific)
					else if (error.message) {
						setFieldError("Username", error.message); // Default to email field
					}
				},
				onSettled: () => {
					setSubmitting(false);
				},
			});
		},
	});

	return formikSignUp;
};

export default useValidationSchema_SignUp;
