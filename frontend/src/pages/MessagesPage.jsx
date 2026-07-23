import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const MessagesPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedUserId = searchParams.get('user_id');

  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
      
      // If preselectedUserId was provided in URL query, load that user
      if (preselectedUserId && !activeUser) {
        const found = res.data.find(c => c.other_user.id === parseInt(preselectedUserId));
        if (found) {
          setActiveUser(found.other_user);
        } else {
          // Fetch user profile if no conversation exists yet
          const userRes = await api.get(`/users/${preselectedUserId}`);
          setActiveUser({ id: userRes.data.id, name: userRes.data.name, email: '' });
        }
      } else if (res.data.length > 0 && !activeUser) {
        setActiveUser(res.data[0].other_user);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  };

  const fetchMessagesWithUser = async (targetUserId) => {
    if (!targetUserId) return;
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/messages/with/${targetUserId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeUser) {
      fetchMessagesWithUser(activeUser.id);
    }
  }, [activeUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputContent.trim() || !activeUser) return;

    setSending(true);
    try {
      const res = await api.post('/messages', {
        receiver_id: activeUser.id,
        content: inputContent,
      });
      setMessages((prev) => [...prev, res.data]);
      setInputContent('');
      fetchConversations(); // refresh conversations list order
    } catch (err) {
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loadingConvs) {
    return (
      <div className="flex-center min-h-[400px]">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-header border-b border-glass pb-4 mb-6">
        <h1 className="text-3xl font-bold font-heading">Messages & Community Chat</h1>
        <p className="text-sm text-secondary">Chat directly with neighbors about item pickups and skill sessions</p>
      </div>

      <div className="messages-layout">
        {/* Left Sidebar: Conversations List */}
        <div className="conversations-sidebar">
          <h3 className="sidebar-heading">Conversations</h3>
          {conversations.length > 0 ? (
            <div className="conversations-list">
              {conversations.map((conv) => {
                const isActive = activeUser && activeUser.id === conv.other_user.id;
                return (
                  <div
                    key={conv.other_user.id}
                    className={`conversation-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveUser(conv.other_user)}
                  >
                    <div className="avatar-circle">
                      {conv.other_user.name[0].toUpperCase()}
                    </div>
                    <div className="conv-info flex-grow overflow-hidden">
                      <div className="flex justify-between items-center">
                        <h4 className="conv-name truncate">{conv.other_user.name}</h4>
                      </div>
                      <p className="conv-snippet truncate text-xs text-muted">
                        {conv.last_message?.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-muted text-sm border border-glass rounded-md">
              No messaging history yet. Click "Message Owner" on any listing to start a chat!
            </div>
          )}
        </div>

        {/* Right Active Chat Pane */}
        <div className="chat-thread-pane">
          {activeUser ? (
            <>
              {/* Chat Thread Header */}
              <div className="chat-thread-header">
                <div className="flex items-center gap-3">
                  <div className="avatar-circle">
                    {activeUser.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{activeUser.name}</h3>
                    <Link to={`/users/${activeUser.id}`} className="text-xs text-primary hover:underline">
                      View Public Profile
                    </Link>
                  </div>
                </div>
              </div>

              {/* Chat Messages List */}
              <div className="chat-messages-body">
                {loadingMsgs ? (
                  <div className="flex-center h-full">
                    <div className="spinner"></div>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`message-bubble-row ${isMine ? 'mine' : 'other'}`}
                      >
                        <div className={`message-bubble ${isMine ? 'bubble-mine' : 'bubble-other'}`}>
                          {msg.listing && (
                            <div className="msg-listing-chip">
                              📍 Regarding: {msg.listing.title}
                            </div>
                          )}
                          <p className="msg-text">{msg.content}</p>
                          <span className="msg-time">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-center h-full text-muted text-sm">
                    No messages yet with {activeUser.name}. Type below to send a message!
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSend} className="chat-input-row">
                <input
                  type="text"
                  className="form-input chat-input-field"
                  placeholder={`Message ${activeUser.name}...`}
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" className="btn-primary-small px-6" disabled={sending}>
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-center h-full text-muted text-sm">
              Select a conversation on the left to start messaging.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
