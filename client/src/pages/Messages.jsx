import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket';

const Messages = () => {
  const { user, isAuthenticated } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Connect to socket when component mounts
  useEffect(() => {
    if (user?.id) {
      const socket = socketService.connect(user.id);
      
      if (socket) {
        setSocketConnected(true);
        console.log('🔌 Socket connected in Messages component');
        console.log('🆔 Socket ID:', socketService.getSocketId());
        console.log('👤 User ID:', user.id);
      }
      
      // Clean up the socket connection when the component unmounts
      return () => {
        console.log('Cleaning up socket listeners in Messages component');
        socketService.offMessage();
      };
    }
  }, [user]);
  
  // Listen for incoming messages
  useEffect(() => {
    if (socketConnected) {
      socketService.onMessage((data) => {
        console.log('📩 Message received in Messages component:', data);
        
        // Add message to the current chat if it's from the selected chat
        if (selectedChat && 
           (data.senderId === selectedChat.otherUser.id || 
            data.chatId === selectedChat.id)) {
          
          console.log('📥 Adding received message to current chat');
          setMessages(prev => [...prev, data]);
          
          // Update chat with latest message
          setChats(prev => prev.map(chat => 
            chat.id === data.chatId || 
            (chat.otherUser.id === data.senderId) 
              ? { 
                  ...chat, 
                  lastMessage: data.content,
                  updatedAt: new Date().toISOString()
                } 
              : chat
          ));
        } else {
          // Update chat list to show new unread message
          console.log('📥 Updating chat list with new message');
          setChats(prev => {
            const chatIndex = prev.findIndex(chat => 
              chat.id === data.chatId || 
              chat.otherUser.id === data.senderId
            );
            
            if (chatIndex >= 0) {
              const updatedChats = [...prev];
              updatedChats[chatIndex] = {
                ...updatedChats[chatIndex],
                lastMessage: data.content,
                updatedAt: new Date().toISOString(),
                unreadCount: (updatedChats[chatIndex].unreadCount || 0) + 1
              };
              return updatedChats;
            }
            
            return prev;
          });
        }
      });
    }
    
    return () => {
      socketService.offMessage();
    };
  }, [socketConnected, selectedChat]);
  
  // Fetch chats
  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
    }
  }, [isAuthenticated]);
  
  const fetchChats = async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching chats...');
      const response = await chatAPI.getChats();
      const chatsData = response.data || [];
      console.log('✅ Chats fetched:', chatsData.length);
      setChats(chatsData);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching chats:', error);
      setError('Failed to load your messages');
      setLoading(false);
    }
  };
  
  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedChat) return;
    
    const fetchMessages = async () => {
      try {
        console.log('📨 Fetching messages for chat:', selectedChat.id);
        const response = await chatAPI.getMessages(selectedChat.id);
        setMessages(response.data || []);
        
        // Mark chat as read when selected
        if (selectedChat.unreadCount) {
          try {
            await chatAPI.markChatAsRead(selectedChat.id);
            
            // Update chat list to show no unread messages
            setChats(prev => prev.map(chat => 
              chat.id === selectedChat.id 
                ? { ...chat, unreadCount: 0 } 
                : chat
            ));
          } catch (error) {
            console.error('Error marking chat as read:', error);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
      }
    };
    
    fetchMessages();
    
    // Scroll to bottom whenever selected chat changes
    scrollToBottom();
  }, [selectedChat, user?.id]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;
    
    try {
      const messageText = newMessage.trim();
      setNewMessage(''); // Clear input field immediately
      
      // Create message object
      const messageData = {
        chatId: selectedChat.id,
        content: messageText,
        senderId: user.id,
        receiverId: selectedChat.otherUser.id,
        createdAt: new Date().toISOString()
      };
      
      // Add message to UI immediately
      const tempMessageId = `temp-${Date.now()}`;
      const tempMessage = {
        ...messageData,
        id: tempMessageId
      };
      
      setMessages(prev => [...prev, tempMessage]);
      
      // Update chat with latest message
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { 
              ...chat, 
              lastMessage: messageText,
              updatedAt: new Date().toISOString()
            } 
          : chat
      ));
      
      // Send via API (this will also store in database)
      await chatAPI.sendMessage(selectedChat.id, messageText);
      
      // Send via socket for real-time delivery
      console.log('📤 Sending message via socket to:', selectedChat.otherUser.id);
      const socketResult = socketService.sendMessage(
        selectedChat.otherUser.id, 
        messageData
      );
      console.log('📤 Socket send result:', socketResult ? 'Message sent via socket' : 'Socket not connected');
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Show error (optional)
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    // If today, show only time
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If yesterday, show "Yesterday" and time
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show date and time
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Messages</h1>
        
        {/* Socket connection indicator */}
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm">
            {socketConnected ? 'Connected' : 'Disconnected'}
            {socketConnected && 
              <span className="text-xs text-gray-500 ml-2">
                Socket ID: {socketService.getSocketId()?.substring(0, 6)}...
              </span>
            }
          </span>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {loading && chats.length === 0 ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex flex-col md:flex-row h-[600px]">
            {/* Chats list */}
            <div className="w-full md:w-1/3 border-r overflow-y-auto">
              <div className="p-4 border-b">
                <h2 className="font-semibold">Your Conversations</h2>
              </div>
              
              {chats.length > 0 ? (
                <ul>
                  {chats.map(chat => (
                    <li 
                      key={chat.id}
                      onClick={() => setSelectedChat(chat)}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedChat?.id === chat.id ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 relative">
                          {chat.otherUser.avatar ? (
                            <img 
                              src={chat.otherUser.avatar} 
                              alt={chat.otherUser.username} 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                              {chat.otherUser.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          
                          {/* Online indicator (could be implemented with socket) */}
                          {socketConnected && (
                            <div className="w-3 h-3 bg-green-500 rounded-full absolute bottom-0 right-0 border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold">{chat.otherUser.username}</p>
                            {chat.unreadCount > 0 && (
                              <span className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                        </div>
                        <div className="text-xs text-gray-500 ml-2 min-w-[60px] text-right">
                          {formatDate(chat.updatedAt).split(',')[0]}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No conversations yet
                </div>
              )}
            </div>
            
            {/* Messages */}
            <div className="w-full md:w-2/3 flex flex-col">
              {selectedChat ? (
                <>
                  <div className="p-4 border-b flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 relative">
                        {selectedChat.otherUser.avatar ? (
                          <img 
                            src={selectedChat.otherUser.avatar} 
                            alt={selectedChat.otherUser.username} 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                            {selectedChat.otherUser.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        {/* Online indicator */}
                        {socketConnected && (
                          <div className="w-3 h-3 bg-green-500 rounded-full absolute bottom-0 right-0 border-2 border-white"></div>
                        )}
                      </div>
                      <div>
                        <h2 className="font-semibold">{selectedChat.otherUser.username}</h2>
                        <p className="text-xs text-gray-500">
                          {socketConnected ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    
                    {/* User ID display for debugging */}
                    <div className="text-xs text-gray-500">
                      User ID: {selectedChat.otherUser.id.substring(0, 6)}...
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(message => (
                      <div 
                        key={message.id}
                        className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.senderId === user.id 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${message.senderId === user.id ? 'text-blue-100' : 'text-gray-500'}`}>
                            {formatDate(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  <div className="p-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <div className="text-4xl mb-4">💬</div>
                  <p className="text-xl font-medium mb-2">Select a conversation to start messaging</p>
                  <p className="text-sm">
                    {socketConnected 
                      ? 'You are connected to real-time messaging' 
                      : 'Connecting to real-time messaging...'}
                  </p>
                  
                  {/* Debug info */}
                  {socketConnected && (
                    <div className="mt-4 text-xs text-gray-400">
                      <p>Socket ID: {socketService.getSocketId()}</p>
                      <p>User ID: {user.id}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;