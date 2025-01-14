import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';

const FAQ_LISTS = {
  donor: [
    {
      question: "How Can I Make a Donation?",
      answer: "Navigate to the Donor Dashboard. Select your preferred donation category. A donation form will appear—choose the items you wish to donate, specify the quantity, and select your delivery method. Click the Submit Donation button to send your request. Your donation request will be reviewed, and you will need to wait for admin approval."
    },
    {
      question: "What Items Can I Donate?",
      answer: "You can donate items in the following categories: Food, School Supplies, Household Essentials, Personal Care Products. If your donation does not fit these categories, you can select the Others category to proceed."
    },
    {
      question: "How To Track My Donation Status",
      answer: "Visit the Donation History page. You will find detailed information about your donation. Check the Status column to track the progress of your donation."
    },
    {
      question: "Where Can I Find My Past Donation Records?",
      answer: "Visit the Donation History page and use the Search Bar or apply filters to find your records."
    }
  ],
  recipient: [
    {
      question: "How Can I Collect Items?",
      answer: "On the sidebar, navigate to the Item List. Browse available items by category, select the items you need, and specify the quantities. "
    },
    {
      question: "What Items Are Available?",
      answer: "Available items vary based on current donations and your campus location. Common categories include: Food, School Supplies, Household Essentials, and Personal Care Products. Check the Item List page for real-time inventory."
    },
    {
      question: "How Do I Collect Item at the Collection Point?",
      answer: "For items with the status 'Ready to Collect,' a 'Show QR' link will be displayed beside them. Click on the link to generate a QR code and show it to the person in charge. They will scan the code and hand you the item."
    },
    {
      question: "How Can I Track My Collection?",
      answer: "Visit the History page to view your collection history. Each items displays its current status and quantity you've collected."
    },
    {
      question: "Can I request for items that are not in the item list?",
      answer: "Yes, you can request the item through the request item feature. Click on the 'Click here to request' link to access the form."
    }
  ]
};

const ChatDialog = ({ isOpen, onClose, userType = 'donor' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFAQ, setShowFAQ] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setShowFAQ(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const messagesRef = collection(db, 'chats', auth.currentUser.uid, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messageList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(messageList);
        scrollToBottom();
      });

      return () => unsubscribe();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, showFAQ]);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.isUser) {
        setWaitingForResponse(false);
        setShowNotification(false);
      }
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      text: newMessage,
      sender: auth.currentUser.uid,
      timestamp: serverTimestamp(),
      isUser: true
    };

    try {
      await addDoc(collection(db, 'chats', auth.currentUser.uid, 'messages'), messageData);
      setNewMessage('');
      setShowNotification(true);
      setWaitingForResponse(true);
      setShowFAQ(true);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleFAQSelect = async (faq) => {
    await addDoc(collection(db, 'chats', auth.currentUser.uid, 'messages'), {
      text: faq.question,
      sender: auth.currentUser.uid,
      timestamp: serverTimestamp(),
      isUser: true
    });

    await addDoc(collection(db, 'chats', auth.currentUser.uid, 'messages'), {
      text: faq.answer,
      sender: 'admin',
      timestamp: serverTimestamp(),
      isUser: false
    });
  };

  const currentFAQList = FAQ_LISTS[userType] || FAQ_LISTS.donor;

  return (
    <div className={`fixed bottom-32 right-6 w-[380px] bg-white rounded-3xl shadow-2xl ${
      isOpen ? 'block' : 'hidden'
    }`}>
      <div className="flex flex-col h-[550px]">
        <div className="shrink-0 flex justify-between items-center px-3 py-1.5 border-b rounded-t-3xl">
          <h3 className="text-lg font-semibold text-gray-800">
            Chat with Admin
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({userType === 'donor' ? 'Donor Support' : 'Recipient Support'})
            </span>
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
          <div className="p-2 pb-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.isUser ? 'justify-end' : 'justify-start'
                } mb-2`}
              >
                <div
                  className={`max-w-[80%] py-2 px-3 rounded-2xl break-words ${
                    message.isUser
                      ? 'bg-blue-500 text-white rounded-br-sm text-left'
                      : 'bg-white text-gray-800 rounded-bl-sm shadow-sm text-left'
                  }`}
                >
                  <span className="whitespace-pre-wrap block">{message.text}</span>
                </div>
              </div>
            ))}

            {waitingForResponse && (
              <div className="flex justify-center mb-2">
                <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm text-center">
                  Your message has been sent. Please wait for admin's response.
                  Meanwhile, you can check our FAQ below.
                </div>
              </div>
            )}

            {showFAQ && (
              <div className="bg-white rounded-xl p-2 shadow-sm mb-2">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-600 font-medium">
                    Frequently Asked Questions:
                  </p>
                  <button
                    onClick={() => setShowFAQ(false)}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    Hide
                  </button>
                </div>
                <div className="space-y-1">
                  {currentFAQList.map((faq, index) => (
                    <button
                      key={index}
                      onClick={() => handleFAQSelect(faq)}
                      className="w-full text-left py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 text-sm border border-gray-100 hover:border-gray-200"
                    >
                      {faq.question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!showFAQ && (
              <div className="flex justify-center mb-2">
                <button
                  onClick={() => setShowFAQ(true)}
                  className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  Show FAQ
                </button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 p-2 border-t bg-white rounded-b-3xl max-h-[120px]">
          <textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              setIsTyping(true);
              e.target.style.height = 'inherit';
              const newHeight = Math.min(e.target.scrollHeight, 84);
              e.target.style.height = `${newHeight}px`;
            }}
            onBlur={() => setIsTyping(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Type your message..."
            rows="1"
            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-full focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300 resize-none min-h-[32px] max-h-[84px] overflow-y-auto scrollbar-hide"
          />
          <button
            onClick={handleSendMessage}
            className="h-8 px-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 flex items-center justify-center shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatDialog;