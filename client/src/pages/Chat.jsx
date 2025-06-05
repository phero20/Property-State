import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';
import socketService from '../services/socket';

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [debugMode, setDebugMode] = useState(process.env.NODE_ENV === 'development');
  const { user, isAuthenticated } = useAuth();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      const socket = socketService.connect(user.id);
      
      if (socket) {
        console.log('🔌 Socket connected in Chat component');
        console.log('🆔 Socket ID:', socketService.getSocketId());
        console.log('👤 User ID:', user.id);
        setSocketConnected(true);
        
        // Listen for incoming messages
        socket.on('getMessage', (data) => {
          console.log('📩 Message received in Chat component:', data);
          
          // Handle incoming message (add to state, etc.)
          if (selectedChat && 
             (data.senderId === selectedChat.otherUser.id || 
              data.chatId === selectedChat.id)) {
            
            console.log('📥 Adding received message to current chat');
            setMessages(prev => [...prev, data]);
          }
        });
      }
      
      return () => {
        // Clean up socket listeners
        if (socket) {
          socket.off('getMessage');
        }
      };
    }
  }, [user, selectedChat]);

  useEffect(() => {
    if (user?.id) {
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    if (!user?.id) {
      console.log('❌ No user ID available for fetching chats');
      setLoading(false);
      return;
    }

    try {
      console.log('💬 Fetching chats for user:', user.id);
      const response = await chatAPI.getChats();
      const chatsData = response.data || [];
      
      console.log('✅ Chats loaded successfully:', chatsData.length);
      console.log('📋 Chat data:', chatsData);
      setChats(chatsData);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  // Fix the fetchMessages function
  const fetchMessages = async (chatId) => {
    try {
      console.log('📨 Fetching messages for chat:', chatId);
      setLoading(true);
      
      // Changed from getChatMessages to getMessages to match the API service
      const response = await chatAPI.getMessages(chatId);
      const messagesData = response.data || [];
      
      console.log('✅ Messages loaded:', messagesData.length);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = async (chat) => {
    console.log('🎯 Selected chat:', chat.id);
    setSelectedChat(chat);
    await fetchMessages(chat.id);
    
    // Mark chat as read
    try {
      await chatAPI.markChatAsRead(chat.id);
      setChats(prev => prev.map(c => 
        c.id === chat.id ? { ...c, unreadCount: 0 } : c
      ));
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  };

  // Fix the handleSendMessage function
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedChat) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      console.log('📤 Sending message:', messageContent);
      
      // Changed from sendChatMessage to sendMessage to match the API service
      const response = await chatAPI.sendMessage(selectedChat.id, messageContent);
      const sentMessage = response.data;
      
      console.log('✅ Message sent successfully:', sentMessage.id);
      
      setMessages(prev => [...prev, sentMessage]);
      scrollToBottom();
      fetchChats();
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setNewMessage(messageContent);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Please login to access your messages</h2>
        <p className="text-gray-600">You need to be logged in to view and send messages.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '600px' }}>
        <div className="flex h-full">
          {/* Chat List Sidebar */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
              <p className="text-sm text-gray-600 mt-1">
                {chats.length} conversation{chats.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && chats.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="ml-3 text-gray-600">Loading conversations...</p>
                </div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="font-medium">No conversations yet</p>
                  <p className="text-sm mt-1">Start chatting with property owners!</p>
                  <div className="mt-4 text-xs text-gray-400">
                    <p>💡 Tip: Contact property owners from listing pages</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleChatSelect(chat)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedChat?.id === chat.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {chat.participantInfo?.avatar ? (
                            <img 
                              src={chat.participantInfo.avatar} 
                              alt={chat.participantInfo.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            // Use otherUser instead of participantInfo for consistency
                            ((chat.otherUser?.fullName || chat.otherUser?.username || 
                              chat.participantInfo?.fullName || chat.participantInfo?.username || 'U')
                              .charAt(0).toUpperCase())
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {chat.otherUser?.fullName || chat.otherUser?.username || 
                               chat.participantInfo?.fullName || chat.participantInfo?.username || 'Unknown User'}
                            </p>
                            {chat.unreadCount > 0 && (
                              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-500 truncate">
                              {chat.lastMessage ? chat.lastMessage.content : 'No messages yet'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {chat.lastMessage ? formatDate(chat.lastMessage.createdAt) : formatDate(chat.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {selectedChat.participantInfo?.avatar ? (
                        <img 
                          src={selectedChat.participantInfo.avatar} 
                          alt={selectedChat.participantInfo.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        (selectedChat.participantInfo?.fullName || selectedChat.participantInfo?.username || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {selectedChat.participantInfo?.fullName || selectedChat.participantInfo?.username || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        @{selectedChat.participantInfo?.username || 'unknown'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="ml-3 text-gray-600">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <div className="text-4xl mb-2">👋</div>
                      <p className="font-medium">No messages yet</p>
                      <p className="text-sm mt-1">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isOwnMessage = message.senderId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwnMessage
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* No Chat Selected */
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                  <p>Choose a conversation from the sidebar to start messaging</p>
                  <div className="mt-6 text-sm text-gray-400">
                    <p>🎯 Click on any conversation to view messages</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {debugMode && (
        <div className="p-3 bg-gray-100 border-t text-xs">
          <div className="mb-2 font-semibold">Debug Info:</div>
          <div className="space-y-1">
            <p>Socket connected: {socketConnected ? 'Yes' : 'No'}</p>
            <p>Socket ID: {socketService.getSocketId()}</p>
            <p>User ID: {user?.id || 'Not logged in'}</p>
            <p>Selected chat: {selectedChat?.id || 'None'}</p>
            <p>API Endpoint: /chat/{selectedChat?.id}/messages</p>
            <button 
              onClick={() => {
                console.log('🔄 Debug refresh triggered');
                fetchChats();
                if (selectedChat) fetchMessages(selectedChat.id);
              }}
              className="mt-2 bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
            >
              Refresh Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;