import LinearSpinner from "../../../components/Loader/LinearSpinner";

const EditImage_Loader = () => {
	return (
		<div className="edit-image-loader bg-[#2d2d2d85] text-white flex items-center justify-center h-screen w-screen fixed top-0 left-0 text-4xl">
			<LinearSpinner customClass="min-h-[80px]" />
		</div>
	);
};

export default EditImage_Loader;
