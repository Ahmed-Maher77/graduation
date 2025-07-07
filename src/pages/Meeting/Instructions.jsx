import React from 'react';

const instructions = [
    "Click the 'Open Camera' button to enable your camera and microphone.",
    // "Use the 'Mute' and 'Stop Camera' buttons to control your audio and video.",
    "Click the 'Start Call' button to create a new meeting, or 'Join Call' to join an existing meeting",
    "Click the 'Share' or 'Copy' icon to share the Call ID with participants to join the call.",
    "Only the 'Person who created the Call' can close it.",
    // "Use the 'Close Camera' button to stop your camera and microphone.",
];

const Instructions = () => {
    const renderInstruction = (instruction) => {
        // Split the instruction by single quotes
        const parts = instruction.split("'");
        return parts.map((part, index) => {
            if (index % 2 === 1) { // Odd indices are inside quotes
                return <b key={index}>{part}</b>;
            }
            return part;
        });
    };

    return (
        <main className="bg-gray-100 p-5 rounded-lg">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800 mb-6">
                <i className="fa-solid fa-circle-question text-blue-600 text-2xl"></i>
                How to Start a Call:
            </h2>
            <ul className="space-y-4 text-gray-700">
                {instructions.map((instruction, index) => (
                    <li key={index} className='flex gap-[8px]'>
                        <i className="fa-solid fa-check-circle text-green-500 text-lg mt-[5px]"></i>
                        <span>

                        {renderInstruction(instruction)} {/* Render the instruction with bolded words */}
                        </span>
                    </li>
                ))}
            </ul>
        </main>
    );
};

export default Instructions;
