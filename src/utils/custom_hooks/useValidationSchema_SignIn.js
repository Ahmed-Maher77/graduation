import { useFormik } from "formik";
import * as Yup from "yup";
import useLogin from "./api/useLogin";

const submitSchema = Yup.object().shape({
	Email: Yup.string()
		.email("Enter a valid email")
		.matches(
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/,
			"Enter a valid email with a top-level domain (e.g., .com, .net)"
		)
		.required("Email is required"),
	Password: Yup.string().required("Password is required"),
});

const useValidationSchema_SignIn = () => {
	const { mutate: handleLogin, isLoading } = useLogin();

	const formikSingIn = useFormik({
		initialValues: {
			Email: "",
			Password: "",
		},
		validationSchema: submitSchema,
		validateOnBlur: true,
		validateOnChange: true,
		onSubmit: (values, { resetForm, setSubmitting, setFieldError }) => {
			handleLogin(values, {
				onSuccess: () => {
					resetForm();
				},
				onError: (error) => {
					console.log("Error object:", error);

					// Handle field-specific errors
					if (error.response?.data?.errors) {
						setErrors(error.response.data.errors); // Formik sets errors for all fields
					}
					// Handle single error message (not field-specific)
					else if (error.response?.data?.message) {
						setFieldError("Email", error.response.data.message); // Defaulting to email field
					}
					// Handle general error
					else if (error.message) {
						setFieldError("Email", error.message); // Default to email or another general field
					}
				},
				onSettled: () => {
					setSubmitting(false);
				},
			});
		},
	});

	return formikSingIn;
};

export default useValidationSchema_SignIn;
