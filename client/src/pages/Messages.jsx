import React, { useState, useEffect } from 'react';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Messages = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const response = await chatAPI.getChats();
        setChats(response.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chats:', error);
        setError('Failed to load your messages');
        setLoading(false);
        
        // For development, add mock chats
        if (process.env.NODE_ENV === 'development') {
          setChats([
            { 
              id: '1', 
              otherUser: { 
                id: 'user1', 
                username: 'johndoe', 
                avatar: 'https://placehold.co/100x100?text=JD' 
              },
              lastMessage: 'Is the apartment still available?',
              updatedAt: new Date().toISOString()
            },
            { 
              id: '2', 
              otherUser: { 
                id: 'user2', 
                username: 'janesmith', 
                avatar: 'https://placehold.co/100x100?text=JS' 
              },
              lastMessage: 'I would like to schedule a viewing.',
              updatedAt: new Date(Date.now() - 86400000).toISOString()
            }
          ]);
        }
      }
    };
    
    fetchChats();
  }, []);
  
  useEffect(() => {
    if (!selectedChat) return;
    
    const fetchMessages = async () => {
      try {
        const response = await chatAPI.getMessages(selectedChat.id);
        setMessages(response.data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        
        // For development, add mock messages
        if (process.env.NODE_ENV === 'development') {
          setMessages([
            {
              id: '1',
              content: 'Hi, is this property still available?',
              senderId: selectedChat.otherUser.id,
              createdAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: '2',
              content: 'Yes, it is! Would you like to schedule a viewing?',
              senderId: user.id,
              createdAt: new Date(Date.now() - 3000000).toISOString()
            },
            {
              id: '3',
              content: 'That would be great. Is tomorrow afternoon possible?',
              senderId: selectedChat.otherUser.id,
              createdAt: new Date(Date.now() - 2400000).toISOString()
            }
          ]);
        }
      }
    };
    
    fetchMessages();
  }, [selectedChat, user.id]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;
    
    try {
      await chatAPI.sendMessage(selectedChat.id, newMessage);
      
      // Add message to the UI right away
      setMessages(prev => [...prev, {
        id: `temp-${Date.now()}`,
        content: newMessage,
        senderId: user.id,
        createdAt: new Date().toISOString()
      }]);
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
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
                        <div className="w-10 h-10 rounded-full bg-gray-300 mr-3">
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
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{chat.otherUser.username}</p>
                          <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(chat.updatedAt).toLocaleDateString()}
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
                  <div className="p-4 border-b">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-300 mr-3">
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
                      </div>
                      <h2 className="font-semibold">{selectedChat.otherUser.username}</h2>
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
                        className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <p>Select a conversation to start messaging</p>
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