import { createSlice } from "@reduxjs/toolkit";

const initialState = {
	userType: "",
	callId: "",
	comingFrom_CallPage: sessionStorage.getItem("comingFromCallPage") === "true",
	username: "Ahmed Maher"
};

const webrtcSlice = createSlice({
	name: "webrtc",
	initialState,
	reducers: {
		setUserType: (state, action) => {
			state.userType = action.payload;
		},
		setCallId: (state, action) => {
			state.callId = action.payload;
		},
		setComingFrom_CallPage: (state, action) => {
			state.comingFrom_CallPage = action.payload;
			sessionStorage.setItem("comingFromCallPage", action.payload);
		},
		setUsername: (state, action) => {
			state.username = action.payload;
		},
	},
});

export const { setUserType, setCallId, setComingFrom_CallPage, setUsername } = webrtcSlice.actions;
export default webrtcSlice.reducer;
