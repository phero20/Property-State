import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatAPI, userAPI } from '../services/api';
import socketService from '../services/socket';
import { toast } from '../utils/toast';
import { useLocation } from 'react-router-dom';

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const messagesContainerRef = useRef(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [creatingChat, setCreatingChat] = useState(false);
  const location = useLocation();
  const selectedChatIdFromNav = location.state?.selectedChatId;
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
    } else {
      setLoading(false);
    }
    return () => {
      if (socketConnected) {
        const socket = socketService.getSocket();
        if (socket) {
          socket.off('getMessage');
        }
      }
    };
  }, [isAuthenticated]);



  useEffect(() => {
    if (user && user._id) {
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    if (user && user._id) {
      socketService.connect(user.id);
    } else if (user && user._id) {
      socketService.connect(user._id);
    }
  }, [user]);

  useEffect(() => {
    if (selectedChatIdFromNav && chats.length > 0) {
      const found = chats.find(c => c._id === selectedChatIdFromNav || c.id === selectedChatIdFromNav);
      if (found) {
        // Leave previous room if any
        if (selectedChatId && socketConnected && socketService.emit) {
          socketService.emit('leaveRoom', selectedChatId);
        }
        setSelectedChatId(found.id || found._id);
        fetchMessages(found.id || found._id);
        // Join the new chat room
        if (socketConnected && socketService.emit) {
          socketService.emit('joinRoom', found.id || found._id);
        }
      } else {
        (async () => {
          try {
            const res = await chatAPI.getChatById(selectedChatIdFromNav);
            if (res.data) {
              // Leave previous room if any
              if (selectedChatId && socketConnected && socketService.emit) {
                socketService.emit('leaveRoom', selectedChatId);
              }
              setSelectedChatId(res.data._id || res.data.id);
              fetchMessages(res.data._id || res.data.id);
              setChats(prev => [res.data, ...prev]);
              // Join the new chat room
              if (socketConnected && socketService.emit) {
                socketService.emit('joinRoom', res.data._id || res.data.id);
              }
            }
          } catch {/* ignore */}
        })();
      }
    }
  }, [selectedChatIdFromNav, chats]);

  useEffect(() => {
    let socket;
    if (user && (user._id || user.id)) {
      const userId = user._id || user.id;
      socket = socketService.connect(userId);
      if (socket) {
        const handleConnect = () => setSocketConnected(true);
        const handleDisconnect = () => setSocketConnected(false);
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        setSocketConnected(socket.connected);
        return () => {
          socket.off('connect', handleConnect);
          socket.off('disconnect', handleDisconnect);
        };
      }
    } else {
      setSocketConnected(false);
    }
  }, [user]);

  useEffect(() => {
    const handleGetMessage = (data) => {
      if (selectedChatId) {
        setMessages(prev => [...prev, data]);
      }
    };
    socketService.onMessage(handleGetMessage);
    return () => {
      socketService.offMessage(handleGetMessage);
    };
  }, [selectedChatId]);

  // Add this robust scroll-to-bottom effect
  useLayoutEffect(() => {
    if (selectedChatId && messages.length > 0) {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  }, [messages, selectedChatId]);

  // Fetch all chats for the user
  const fetchChats = async () => {
    if (!user || !user._id) return;
    setLoading(true);
    try {
      const res = await chatAPI.getChats();
      setChats(res.data);
    } catch {/* ignore */}
    setLoading(false);
  };

  // Fetch messages for a chat
  const fetchMessages = async (chatId) => {
    try {
      setLoading(true);
      const response = await chatAPI.getMessages(chatId);
      setMessages(response.data || []);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        alert("You don't have permission to access these messages.");
        setSelectedChatId(null);
      }
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Select a chat
  const handleChatSelect = (chat) => {
    if (selectedChatId && socketConnected && socketService.emit) {
      socketService.emit('leaveRoom', selectedChatId);
    }
    setSelectedChatId(chat.id || chat._id);
    fetchMessages(chat.id || chat._id);
    setShowMobileChat(true);
  };

  // Send a message
 const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatId) return;
    const messageContent = newMessage.trim();
    const chatId = selectedChatId;
  
    // 1. Optimistically add the message to the UI
    const tempMessage = {
      id: `temp_${Date.now()}`,
      chatId,
      content: messageContent,
      senderId: user._id,
      createdAt: new Date().toISOString(),
      optimistic: true // optional: mark as optimistic
    };
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
  
    try {
      // 2. Send to backend
      const response = await chatAPI.sendMessage(chatId, messageContent);
      const sentMessage = response.data;
  
      // 3. Replace the optimistic message with the real one from backend
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempMessage.id ? sentMessage : msg
        )
      );
  
      setChats(prevChats =>
        prevChats.map(chat =>
          (chat.id === chatId || chat._id === chatId)
            ? { ...chat, lastMessage: messageContent, updatedAt: new Date().toISOString() }
            : chat
        )
      );
  
      // 4. Send via socket
      if (socketConnected) {
        const chat = chats.find(c => (c.id || c._id) === selectedChatId);
        const receiverId = chat && chat.user && chat.user.id;
        if (receiverId) {
          socketService.sendMessage(receiverId, {
            chatId,
            content: messageContent,
            senderId: user._id,
            createdAt: sentMessage.createdAt
          });
        }
      }
    } catch {
      // 5. If failed, remove the optimistic message and show error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      alert('Failed to send message. Please try again.');
      setNewMessage(messageContent);
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(message);
    });
    return Object.entries(groups).map(([date, messages]) => ({ date, messages }));
  };

  // Get relative time label
  const getRelativeTimeLabel = (dateString) => {
    if (!dateString) return 'Recently';
    let date;
    try {
      date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Recently';
    } catch {
      return 'Recently';
    }
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // User search for new chat
  const handleUserSearch = async (e) => {
    setUserSearch(e.target.value);
    if (e.target.value.length < 2) {
      setUserResults([]);
      return;
    }
    try {
      const res = await userAPI.searchUsers(e.target.value);
      setUserResults(res.data.filter(u => u._id !== user._id));
    } catch {
      setUserResults([]);
    }
  };

  // Create a new chat
  const handleCreateChat = async (otherUserId) => {
    setCreatingChat(true);
    try {
      const res = await chatAPI.createChat(otherUserId);
      if (res.data && res.data._id) {
        setChats(prev => [res.data, ...prev.filter(c => c._id !== res.data._id)]);
        setSelectedChatId(res.data.id || res.data._id);
        setShowNewChatModal(false);
        toast.success('Chat created!');
        if (socketConnected && socketService.emit) {
          socketService.emit('joinRoom', res.data._id);
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create chat');
    }
    setCreatingChat(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Please login to access your messages</h2>
        <p className="text-gray-600">You need to be logged in to view and send messages.</p>
      </div>
    );
  }

  // Redesigned layout: wider, modern, and responsive
  return (
    <div className="flex flex-col items-center justify-center md:px-5 px-0 h-screen bg-[var(--bg-main)]">
      <div className="w-full max-w-7xl md:h-[80vh]  h-screen bg-[var(--bg-card)] rounded-xl shadow-lg flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar: Chat List */}
        <div
          className={`w-full md:w-1/3 min-w-0 md:min-w-[320px] bg-[var(--bg-card)] border-b md:border-b-0 md:border-r border-gray-200 flex flex-col h-1/2 md:h-auto
          ${showMobileChat ? 'hidden' : 'flex'} md:flex`}
        >
          {/* <div className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Chats</h2>
            <button
              className="bg-blue-600 text-white px-2 py-1 md:px-3 md:py-1 rounded hover:bg-blue-700 text-sm md:text-base"
              onClick={() => setShowNewChatModal(true)}
            >
              + New
            </button>
          </div> */}
          <div className="flex-1 overflow-y-auto">
            {loading && chats.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--theme-accent)]"></div>
                <p className="ml-3 text-[var(--text-muted)]">Loading conversations...</p>
              </div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center text-[var(--text-muted)]">
                <div className="text-4xl mb-2">💬</div>
                <p className="font-medium">No conversations yet</p>
                <p className="text-sm mt-1">Start chatting with property owners!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {chats.map((chat) => {
                  const lastActivity = chat.updatedAt || chat.createdAt;
                  const dateLabel = getRelativeTimeLabel(lastActivity);
                  return (
                    <div
                      key={chat.id || chat._id}
                      onClick={() => handleChatSelect(chat)}
                      className={`p-5 cursor-pointer hover:bg-[var(--hover-theme-accent)] transition-colors flex items-center space-x-4 ${
                        selectedChatId === chat.id || selectedChatId === chat._id ? 'bg-[var(--theme-accent)]' : ''
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[var(--text-main)] flex items-center justify-center text-[var(--text-on-accent)] font-semibold text-xl">
                        {chat.user?.avatar ? (
                          <img src={chat.user.avatar} alt={chat.user.username} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          (chat.user?.username || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-medium text-[var(--text-main)] truncate">
                            {chat.user?.username || 'Unknown User'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-[var(--text-light)] truncate">
                            {chat.lastMessage ? chat.lastMessage : 'No messages yet'}
                          </p>
                          <p className="text-xs text-[var(--text-light)]">{dateLabel}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {/* Main Chat Area */}
        <div
          className={`flex-1 flex flex-col h-1/2 md:h-auto ${selectedChatId ? '' : 'hidden'} ${showMobileChat ? 'flex' : 'hidden'} md:flex`}
        >
          {selectedChatId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 md:p-6 border-b border-gray-200 bg-[var(--bg-card)] flex items-center space-x-3 md:space-x-4">
                {/* Back button for mobile */}
                <button
                  className="md:hidden mr-2 text-[var(--theme-accent)] hover:text-[var(--hover-theme-accent)]"
                  onClick={() => setShowMobileChat(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--theme-accent)] flex items-center justify-center text-[var(--text-on-accent)] font-semibold text-lg md:text-xl">
                  {selectedChatId && chats.length > 0 ? (
                    (() => {
                      const chatUser = chats.find(c => c.id === selectedChatId || c._id === selectedChatId)?.user;
                      if (chatUser?.avatar) {
                        return <img src={chatUser.avatar} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover" />;
                      } else {
                        return (chatUser?.username || 'U').charAt(0).toUpperCase();
                      }
                    })()
                  ) : (
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--text-main)] text-base md:text-lg">
                    {selectedChatId && chats.length > 0 ? (
                      chats.find(c => c.id === selectedChatId || c._id === selectedChatId).user?.username || 'Unknown User'
                    ) : 'Select a chat'}
                  </h3>
                  <div className="text-xs md:text-sm text-[var(--text-muted)]">{selectedChatId && chats.length > 0 ? chats.find(c => c.id === selectedChatId || c._id === selectedChatId).user?.email || 'No email available' : ''}</div>
                </div>
              </div>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-2 md:p-8 space-y-2 md:space-y-4 bg-[var(--bg-main)]" ref={messagesContainerRef}>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--theme-accent)]"></div>
                    <p className="ml-3 text-[var(--text-muted)]">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-[var(--text-muted)] mt-8">
                    <div className="text-4xl mb-2">👋</div>
                    <p className="font-medium">No messages yet</p>
                    <p className="text-sm mt-1">Start the conversation!</p>
                  </div>
                ) : (
                  groupMessagesByDate(messages).map((group) => (
                    <div key={group.date} className="space-y-4">
                      <div className="flex items-center justify-center my-6">
                        <div className="bg-[var(--bg-card)] rounded-full px-3 py-1 text-xs text-[var(--text-muted)]">
                          {group.date}
                        </div>
                      </div>
                      {group.messages.map((message) => {
                        const isOwnMessage = message.senderId === user?._id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs md:max-w-lg px-3 md:px-5 py-2 md:py-3 rounded-2xl shadow-sm ${
                                isOwnMessage
                                  ? 'bg-[var(--theme-accent)] text-[var(--text-on-accent)]'
                                  : 'bg-[var(--bg-card)] text-[var(--text-main)]'
                              }`}
                            >
                              <p className="text-base">{message.content}</p>
                              <p className={`text-xs mt-1 ${isOwnMessage ? 'text-[var(--text-light)]' : 'text-[var(--text-muted)]'}`}>{
                                new Date(message.createdAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              }</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-2 md:p-6 border-t border-gray-200 bg-[var(--bg-card)]">
                <div className="flex space-x-2 md:space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-2 py-2 md:px-4 md:py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] text-sm md:text-base bg-[var(--bg-main)] text-[var(--text-main)]"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-[var(--theme-accent)] cursor-pointer text-[var(--text-on-accent)] px-4 py-2 md:px-6 md:py-3 rounded-full hover:bg-[var(--hover-theme-accent)] disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base font-semibold"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
              <span>Select a chat or start a new one.</span>
            </div>
          )}
        </div>
      </div>
      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] p-8 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-[var(--text-main)]">Start a New Chat</h3>
            <input
              type="text"
              className="w-full border p-2 rounded mb-2 bg-[var(--bg-main)] text-[var(--text-main)]"
              placeholder="Search users by name or email..."
              value={userSearch}
              onChange={handleUserSearch}
              autoFocus
            />
            <ul className="max-h-40 overflow-y-auto mb-4">
              {userResults.map(u => (
                <li
                  key={u._id}
                  className="p-2 hover:bg-[var(--hover-theme-accent)] rounded cursor-pointer text-[var(--text-main)]"
                  onClick={() => handleCreateChat(u._id)}
                >
                  {u.username} <span className="text-[var(--text-muted)] text-sm">({u.email})</span>
                </li>
              ))}
              {userSearch && userResults.length === 0 && (
                <li className="text-[var(--text-muted)] p-2">No users found.</li>
              )}
            </ul>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-[var(--bg-main)] text-[var(--text-main)]"
                onClick={() => setShowNewChatModal(false)}
                disabled={creatingChat}
              >
                Cancel
              </button>
            </div>
            {creatingChat && <div className="text-center text-[var(--text-muted)] mt-2">Creating chat...</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
