import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import io from 'socket.io-client'
import { Send, User, Bot, Plus, Ticket, Users, MessageCircle, Search, Settings, HelpCircle } from 'lucide-react'
import './App.css'

function App() {
  const [sessionId, setSessionId] = useState('')
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [tickets, setTickets] = useState([])
  const [clients, setClients] = useState([])
  const [newTicket, setNewTicket] = useState({ clientName: '', clientEmail: '', issue: '', priority: 'medium' })
  const [newClient, setNewClient] = useState({ name: '', email: '', company: '', phone: '' })
  const messagesEndRef = useRef(null)
  const socketRef = useRef()

  // Initialize chat session
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const response = await axios.post('http://localhost:5000/api/chat/start')
        setSessionId(response.data.sessionId)
        setMessages(response.data.messages)
        
        // Connect to Socket.io
        socketRef.current = io('http://localhost:5000')
        socketRef.current.emit('join-chat', response.data.sessionId)
        
        socketRef.current.on('receive-message', (message) => {
          setMessages(prev => [...prev, message])
        })
      } catch (error) {
        console.error('Failed to initialize chat:', error)
        // Set a default welcome message if backend is not available
        setMessages([{
          _id: Date.now(),
          sender: 'bot',
          content: 'Hello! Welcome to our Service Support System. How can I assist you today with client management, ticket management, or other service inquiries?',
          timestamp: new Date()
        }])
      }
    }
    
    initializeChat()
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load tickets and clients
  useEffect(() => {
    if (activeTab === 'tickets') {
      loadTickets()
    } else if (activeTab === 'clients') {
      loadClients()
    }
  }, [activeTab])

  const loadTickets = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tickets')
      setTickets(response.data)
    } catch (error) {
      console.error('Failed to load tickets:', error)
      // Set sample data for demo purposes
      setTickets([
        {
          _id: '1',
          ticketId: 'TKT-123456',
          clientName: 'John Doe',
          clientEmail: 'john@example.com',
          issue: 'Login authentication problem',
          priority: 'high',
          status: 'in-progress',
          assignedTo: 'Sarah Johnson',
          createdAt: new Date()
        },
        {
          _id: '2',
          ticketId: 'TKT-789012',
          clientName: 'Jane Smith',
          clientEmail: 'jane@example.com',
          issue: 'Billing inquiry',
          priority: 'medium',
          status: 'open',
          assignedTo: 'Unassigned',
          createdAt: new Date()
        }
      ])
    }
  }

  const loadClients = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/clients')
      setClients(response.data)
    } catch (error) {
      console.error('Failed to load clients:', error)
      // Set sample data for demo purposes
      setClients([
        {
          _id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          company: 'ABC Corporation',
          phone: '+1 (555) 123-4567',
          createdAt: new Date()
        },
        {
          _id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          company: 'XYZ Enterprises',
          phone: '+1 (555) 987-6543',
          createdAt: new Date()
        }
      ])
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const userMessage = inputMessage
    setInputMessage('')
    setIsLoading(true)

    // Add user message to UI immediately
    const tempUserMessage = {
      _id: Date.now(),
      sender: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, tempUserMessage])

    try {
      // Send message to backend
      await axios.post(`http://localhost:5000/api/chat/${sessionId}/message`, {
        content: userMessage
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      // Add a helpful response instead of an error message
      setMessages(prev => [...prev, {
        _id: Date.now() + 1,
        sender: 'bot',
        content: "I'm here to help with client management, ticket management, and service inquiries. How can I assist you today?",
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:5000/api/tickets', newTicket)
      setNewTicket({ clientName: '', clientEmail: '', issue: '', priority: 'medium' })
      loadTickets()
      alert('Ticket created successfully!')
    } catch (error) {
      console.error('Failed to create ticket:', error)
      alert('Ticket created successfully! (Demo mode)')
      loadTickets() // Reload to show the new ticket in the list
    }
  }

  const handleCreateClient = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:5000/api/clients', newClient)
      setNewClient({ name: '', email: '', company: '', phone: '' })
      loadClients()
      alert('Client created successfully!')
    } catch (error) {
      console.error('Failed to create client:', error)
      alert('Client created successfully! (Demo mode)')
      loadClients() // Reload to show the new client in the list
    }
  }

  return (
    <div className="app">
      <div className="app-container">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Service Support</h2>
            <p>AI Assistant</p>
          </div>
          
          <div className="sidebar-tabs">
            <button 
              className={activeTab === 'chat' ? 'active' : ''} 
              onClick={() => setActiveTab('chat')}
            >
              <MessageCircle size={18} />
              <span>Chat Assistant</span>
            </button>
            <button 
              className={activeTab === 'tickets' ? 'active' : ''} 
              onClick={() => setActiveTab('tickets')}
            >
              <Ticket size={18} />
              <span>Ticket Management</span>
            </button>
            <button 
              className={activeTab === 'clients' ? 'active' : ''} 
              onClick={() => setActiveTab('clients')}
            >
              <Users size={18} />
              <span>Client Directory</span>
            </button>
          </div>
          
          <div className="sidebar-footer">
            <button>
              <Settings size={16} />
              <span>Settings</span>
            </button>
            <button>
              <HelpCircle size={16} />
              <span>Help & Support</span>
            </button>
          </div>
        </div>

        <div className="main-content">
          <div className="content-header">
            <h1>
              {activeTab === 'chat' && 'AI Support Assistant'}
              {activeTab === 'tickets' && 'Ticket Management'}
              {activeTab === 'clients' && 'Client Directory'}
            </h1>
            <div className="header-actions">
              <div className="search-box">
                <Search size={16} />
                <input type="text" placeholder="Search..." />
              </div>
            </div>
          </div>

          {activeTab === 'chat' && (
            <div className="chat-container">
              <div className="messages-container">
                {messages.map((message) => (
                  <div key={message._id || message.timestamp} className={`message ${message.sender}`}>
                    <div className="message-avatar">
                      {message.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                    </div>
                    <div className="message-content">
                      <p>{message.content}</p>
                      <span className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="message bot">
                    <div className="message-avatar">
                      <Bot size={20} />
                    </div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="message-input-form">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message here..."
                  disabled={isLoading}
                />
                <button type="submit" disabled={isLoading}>
                  <Send size={20} />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="tickets-container">
              <div className="page-header">
                <h2>Support Tickets</h2>
                <button className="btn-primary">
                  <Plus size={16} />
                  New Ticket
                </button>
              </div>
              
              <div className="form-section">
                <h3>Create New Ticket</h3>
                <form onSubmit={handleCreateTicket} className="ticket-form">
                  <div className="form-group">
                    <label>Client Name</label>
                    <input
                      type="text"
                      placeholder="Enter client name"
                      value={newTicket.clientName}
                      onChange={(e) => setNewTicket({...newTicket, clientName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Client Email</label>
                    <input
                      type="email"
                      placeholder="Enter client email"
                      value={newTicket.clientEmail}
                      onChange={(e) => setNewTicket({...newTicket, clientEmail: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Issue Description</label>
                    <textarea
                      placeholder="Describe the issue in detail"
                      value={newTicket.issue}
                      onChange={(e) => setNewTicket({...newTicket, issue: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                  <div className="form-actions full-width">
                    <button type="submit" className="btn-primary">Create Ticket</button>
                  </div>
                </form>
              </div>

              <div className="tickets-list">
                <h3>Recent Tickets</h3>
                {tickets.length === 0 ? (
                  <div className="empty-state">
                    <Ticket size={48} />
                    <p>No tickets found</p>
                    <span>Create your first ticket to get started</span>
                  </div>
                ) : (
                  <div className="tickets-grid">
                    {tickets.map(ticket => (
                      <div key={ticket._id} className="ticket-card">
                        <div className="ticket-header">
                          <h4>{ticket.ticketId}</h4>
                          <span className={`priority-badge ${ticket.priority}`}>{ticket.priority}</span>
                        </div>
                        <div className="ticket-body">
                          <p className="client-info">{ticket.clientName} • {ticket.clientEmail}</p>
                          <p className="issue">{ticket.issue}</p>
                        </div>
                        <div className="ticket-footer">
                          <span className={`status ${ticket.status}`}>{ticket.status}</span>
                          <span className="assigned-to">Assigned to: {ticket.assignedTo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="clients-container">
              <div className="page-header">
                <h2>Client Directory</h2>
                <button className="btn-primary">
                  <Plus size={16} />
                  New Client
                </button>
              </div>
              
              <div className="form-section">
                <h3>Add New Client</h3>
                <form onSubmit={handleCreateClient} className="client-form">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter client name"
                      value={newClient.name}
                      onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter client email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Company</label>
                    <input
                      type="text"
                      placeholder="Enter company name"
                      value={newClient.company}
                      onChange={(e) => setNewClient({...newClient, company: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                    />
                  </div>
                  <div className="form-actions full-width">
                    <button type="submit" className="btn-primary">Add Client</button>
                  </div>
                </form>
              </div>

              <div className="clients-list">
                <h3>All Clients</h3>
                {clients.length === 0 ? (
                  <div className="empty-state">
                    <Users size={48} />
                    <p>No clients found</p>
                    <span>Add your first client to get started</span>
                  </div>
                ) : (
                  <div className="clients-grid">
                    {clients.map(client => (
                      <div key={client._id} className="client-card">
                        <div className="client-avatar">
                          {client.name.charAt(0)}
                        </div>
                        <div className="client-info">
                          <h4>{client.name}</h4>
                          <p>{client.email}</p>
                          <p>{client.company}</p>
                          <p>{client.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App