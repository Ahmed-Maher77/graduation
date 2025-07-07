import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import Slide from "../../components/Slider/Slide";
import "./MainSlider.scss";
import slide_1 from "../../assets/slide-1.png"
import slide_2 from "../../assets/slide-2.png"
import slide_3 from "../../assets/slide-3.png"

const MainSlider = () => {
	const slides = [
		{
			img: slide_1,
			title: "Bridging the Communication Gap",
			description:
				"Connect seamlessly between deaf and hearing individuals with real-time sign language and speech translation.",
		},
		{
			img: slide_2,
			title: "AI-Powered Real-Time Translation",
			description:
				"Experience instant conversion of Arabic and American Sign Language into text and speech, powered by advanced computer vision.",
		},
		{
			img: slide_3,
			title: "Accessible Anywhere, Anytime",
			description:
				"Available on web and mobile devices with secure, high-quality video calls using WebRTC technology.",
		},
	];

	return (
		<Swiper
			modules={[Navigation, Pagination, Scrollbar, Autoplay]}
			spaceBetween={50}
			slidesPerView={1}
			navigation={{
				nextEl: ".swiper-button-next",
				prevEl: ".swiper-button-prev",
			}}
			pagination={{
				clickable: true,
				type: "bullets",
			}}
            autoplay={{
                delay: 2500,
                disableOnInteraction: false, 
                pauseOnMouseEnter: true,     
                stopOnLastSlide: false,      
            }}
			loop={true}
			direction="horizontal"
			grabCursor={true}
			className="swiper"
		>
			{slides.map((slide, i) => (
				<SwiperSlide key={i}>
					<Slide
						img={slide.img}
						title={slide.title}
						description={slide.description}
					/>
				</SwiperSlide>
			))}

			{/* Navigation Controls */}
			<div className="swiper-button-next"></div>
			<div className="swiper-button-prev"></div>
			<div className="swiper-pagination"></div>
		</Swiper>
	);
};

export default MainSlider;
