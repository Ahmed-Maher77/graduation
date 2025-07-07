import MainSlider from "../../components/Slider/MainSlider";
import "./Home.scss";
import Banner from "./Banner"
import StatsSection from "../../components/Stats_Section/StatsSection";

const Home = () => {
	return (
		<div className="Home-Page ">
			<div className="container py-4" style={{minHeight: "calc(100vh - 60px)"}}>
				<main className="flex flex-col justify-center min-h-[500px]">
					<MainSlider />
				</main>
			</div>
			<Banner />
			<StatsSection />
		</div>
	);
};

export default Home;
