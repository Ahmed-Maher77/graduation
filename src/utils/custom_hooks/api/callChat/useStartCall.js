import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../axiosConfig"

const useStartCall = () => {
    const queryClient = useQueryClient();
    
    const { mutateAsync: startCallChat, isPending, error, data } = useMutation({
        mutationFn: (callIntitalData) => api.post("/startCall", callIntitalData),
        
        onSuccess: (data) => {
            console.log("Call started successfully!", data);
        },
        
        onError: (error) => {
            console.error("Error starting call:", error.message);
        },
    });
    return { startCallChat, isPending, error, data };
};
export default useStartCall;


// const {startCallChat, isPending: isStartingCall, error: startCallError, data: startCallData} = useStartCall();
