import React from 'react';
import { FaComments } from 'react-icons/fa';

const ChatButton = ({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 p-4 ${
        isOpen ? 'bg-gray-500' : 'bg-blue-500'
      } text-white rounded-full shadow-lg hover:bg-opacity-90 transition-colors`}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      <FaComments className="w-6 h-6" />
    </button>
  );
};

export default ChatButton; 