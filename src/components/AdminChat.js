import { useEffect, useState, useRef } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  getDoc, 
  addDoc, 
  serverTimestamp,
  onSnapshot,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import Sidebar from './Sidebar';
import { IoSearchOutline } from 'react-icons/io5';

function AdminChat() {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [userProfiles, setUserProfiles] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); 
  const [chatListWidth, setChatListWidth] = useState(400);
  const resizeRef = useRef(null);
  const isResizingRef = useRef(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    let filtered = messages;

    filtered = filtered.filter(chat => chat.messages && chat.messages.length > 0);

    // Apply role filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(chat => chat.userRole === activeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((chat) => {
        const userName = chat.userName?.toLowerCase() || '';
        const searchTerm = searchQuery.toLowerCase();
        
        const messagesMatch = chat.messages?.some(message => 
          message.text?.toLowerCase().includes(searchTerm)
        );
        
        const userMatch = userName.includes(searchTerm);
        
        return userMatch || messagesMatch;
      });
    }

    setFilteredMessages(filtered);
  }, [messages, searchQuery, activeFilter]);

  useEffect(() => {
    const fetchUserAndMessages = async () => {
      try {
        console.log('Starting to fetch messages and user data...');
        
        // Fetch all users from the users collection
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const profiles = {};
        const userIds = [];

        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          profiles[doc.id] = {
            name: userData.name || userData.fullName || 'Anonymous User',
            role: userData.role || 'donor',
            email: userData.email
          };
          userIds.push(doc.id);
        });

        setUserProfiles(profiles);

        // Set up real-time listeners for each user's chat
        userIds.forEach(userId => {
          const messagesRef = collection(db, 'chats', userId, 'messages');
          const q = query(messagesRef, orderBy('timestamp', 'asc'));
          
          onSnapshot(q, (snapshot) => {
            const chatMessages = snapshot.docs.map(doc => ({
              id: doc.id,
              userId: userId,
              ...doc.data()
            }));

            if (chatMessages.length > 0) {
              setMessages(prevMessages => {
                const otherChats = prevMessages.filter(chat => chat.userId !== userId);
                
                const updatedChat = {
                  userId: userId,
                  userName: profiles[userId]?.name,
                  userRole: profiles[userId]?.role,
                  messages: chatMessages,
                  lastMessage: chatMessages[chatMessages.length - 1],
                  lastTimestamp: chatMessages[chatMessages.length - 1]?.timestamp,
                  unreadCount: chatMessages.filter(msg => msg.isUser && !msg.read).length
                };

                const newMessages = [...otherChats, updatedChat].sort((a, b) => {
                  const timeA = a.lastTimestamp?.toMillis() || 0;
                  const timeB = b.lastTimestamp?.toMillis() || 0;
                  return timeB - timeA;
                });

                if (selectedChat?.userId === userId) {
                  setSelectedChat(updatedChat);
                }

                return newMessages;
              });
            }
          });
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchUserAndMessages();

    const checkSidebarState = () => {
      const sidebar = document.querySelector('.sidebar');
      setIsCollapsed(sidebar?.classList.contains('collapsed') || false);
    };

    checkSidebarState();
    const observer = new MutationObserver(checkSidebarState);
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      observer.observe(sidebar, { attributes: true });
    }

    return () => observer.disconnect();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const messagesRef = collection(db, 'chats', selectedChat.userId, 'messages');
      
      // Add new message
      await addDoc(messagesRef, {
        text: newMessage,
        timestamp: serverTimestamp(),
        isUser: false,
        senderId: 'admin'
      });

      setNewMessage('');

      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      const messagesSnapshot = await getDocs(q);
      
      const updatedMessages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        userId: selectedChat.userId,
        ...doc.data()
      }));

      // Update messages state and move this chat to top
      setMessages(prevMessages => {
        const otherChats = prevMessages.filter(chat => chat.userId !== selectedChat.userId);
        const updatedChat = {
          ...selectedChat,
          messages: updatedMessages,
          lastMessage: updatedMessages[updatedMessages.length - 1]
        };
        
        // Put the updated chat at the beginning of the array
        return [updatedChat, ...otherChats];
      });

      // Update selected chat
      setSelectedChat(prev => ({
        ...prev,
        messages: updatedMessages,
        lastMessage: updatedMessages[updatedMessages.length - 1]
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  // Handle chat selection
  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    
    // Immediately scroll to bottom before marking as read
    requestAnimationFrame(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    });
    
    try {
      const messagesRef = collection(db, 'chats', chat.userId, 'messages');
      const unreadQuery = query(
        messagesRef,
        where('isUser', '==', true),
        where('read', '==', false)
      );
      
      const unreadDocs = await getDocs(unreadQuery);
      const updatePromises = unreadDocs.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      );
      
      await Promise.all(updatePromises);

      // Update the unread count in the messages list
      setMessages(prevMessages => 
        prevMessages.map(prevChat => 
          prevChat.userId === chat.userId 
            ? { ...prevChat, unreadCount: 0 }
            : prevChat
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Handle mouse events for resizing
  const handleMouseMove = (e) => {
    if (!isResizingRef.current) return;
    
    // Calculate new width (minimum 280px, maximum 600px)
    const newWidth = Math.max(280, Math.min(600, e.clientX - 250));
    setChatListWidth(newWidth);
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col h-screen">
      <Sidebar userRole="admin" />
      <div className={`flex-1 p-4 transition-all duration-300 ${
        isCollapsed ? 'ml-[80px]' : 'ml-[250px]'
      }`}>
        <div className="bg-white rounded-lg shadow flex flex-col h-[calc(100vh-2rem)]">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Support Messages</h2>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Chat list with resizable width */}
            <div style={{ width: chatListWidth }} className="relative flex flex-col border-r">
              <div className="p-3 border-b space-y-3">
                {/* Search bar */}
                <div className="flex items-center bg-gray-100 rounded-lg p-2">
                  <IoSearchOutline className="text-gray-500 mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats"
                    className="bg-transparent outline-none flex-1"
                  />
                </div>
                
                {/* Filter buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeFilter === 'all'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveFilter('donor')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeFilter === 'donor'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Donors
                  </button>
                  <button
                    onClick={() => setActiveFilter('student')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      activeFilter === 'student'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Recipients
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1">
                {filteredMessages.length === 0 ? (
                  <div className="p-4 text-gray-500 text-center">
                    {searchQuery ? 'No matching chats found' : 'No chats found'}
                  </div>
                ) : (
                  filteredMessages.map((chat) => (
                    <div
                      key={chat.userId}
                      onClick={() => handleChatSelect(chat)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedChat?.userId === chat.userId ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium">{chat.userName}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          chat.userRole === 'donor' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {chat.userRole}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">{chat.userEmail}</div>
                      <div className="text-sm text-gray-500 truncate mt-1 text-left">
                        {chat.lastMessage?.text}
                      </div>
                      {chat.unreadCount > 0 && (
                        <div className="mt-1">
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {chat.unreadCount} new
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Resize handle */}
              <div
                ref={resizeRef}
                className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 hover:opacity-50 z-10"
              />
            </div>

            {/* Main chat area */}
            <div className="flex-1 flex flex-col min-h-0">
              {selectedChat ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-lg">{selectedChat.userName}</div>
                        <div className="text-sm text-gray-500">{selectedChat.userEmail}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm ${
                        selectedChat.userRole === 'donor'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {selectedChat.userRole}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div 
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-0"
                  >
                    {selectedChat.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`mb-3 flex ${message.isUser ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className="inline-flex flex-col max-w-[70%]">
                          <div
                            className={`p-3 rounded-lg text-left ${
                              message.isUser 
                                ? 'bg-white' 
                                : 'bg-blue-500 text-white'
                            } shadow-sm`}
                          >
                            {message.text}
                          </div>
                          <span className={`text-xs text-gray-500 mt-1 ${
                            message.isUser ? 'text-left' : 'text-right'
                          }`}>
                            {message.timestamp?.toDate().toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input area */}
                  <div className="bg-white border-t">
                    <div className="flex items-start px-4 py-2">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border rounded-lg outline-none resize-none min-h-[40px] max-h-[80px]"
                        rows="1"
                      />
                      <button 
                        onClick={handleSendMessage}
                        className="ml-3 px-6 h-10 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                        disabled={!newMessage.trim()}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a chat to start messaging
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminChat;