// frontend/src/pages/TicketView.jsx (FINAL AND GUARANTEED TO WORK)

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiService from '../services/api';
import './TicketView.css';

const TicketView = ({ isAdmin = false, isNew = false }) => {
    const { id: ticketId } = useParams();
    const navigate = useNavigate();

    // स्टेट को सरल बनाया गया
    const [ticket, setTicket] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(!isNew); // isNew पर लोडिंग false रहेगी
    const [error, setError] = useState('');
    
    // Form states
    const [subject, setSubject] = useState('');
    const [newMessage, setNewMessage] = useState('');
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);
    const chatEndRef = useRef(null);

    const fetchTicketData = async () => {
        if (isNew || !ticketId) return;
        setLoading(true);
        setError('');
        try {
            const response = isAdmin 
                ? await apiService.getAdminTicketById(ticketId)
                : await apiService.getUserTicketById(ticketId);
            setTicket(response.data.ticket);
            setReplies(response.data.replies);
        } catch (err) {
            setError('Failed to load ticket data. It may not exist or you may not have permission to view it.');
        } finally {
            setLoading(false);
        }
    };
    
    // ✅✅✅ मुख्य समाधान: useEffect अब सिर्फ ticketId पर निर्भर है ✅✅✅
    // जब आप /new से /6 पर जाते हैं, तो ticketId बदलता है और यह useEffect अपने आप चलता है।
    // यह आपके "ऑटो-रिफ्रेश" वाले विचार को React के तरीके से लागू करता है।
    useEffect(() => {
        fetchTicketData();
    }, [ticketId, isAdmin]);
    
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [replies]);

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleNewTicketSubmit = async (e) => {
        e.preventDefault();
        if (!subject || !newMessage) {
            toast.error('Subject and message are required for a new ticket.');
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('subject', subject);
        formData.append('message', newMessage);
        if (file) {
            formData.append('attachment', file);
        }

        try {
            const response = await apiService.createSupportTicket(formData);
            toast.success('Ticket created successfully!');
            const newTicket = response.data.ticket;
            
            // अब हम कोई डेटा पास नहीं कर रहे हैं, सिर्फ़ रीडायरेक्ट कर रहे हैं।
            // नया कंपोनेंट अपने आप डेटा ले आएगा।
            navigate(
                isAdmin ? `/admin/tickets/${newTicket.id}` : `/support/ticket/${newTicket.id}`,
                { replace: true }
            );

        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create ticket.');
            setIsSubmitting(false); // ✅ फेल होने पर सबमिटिंग स्टेट को रीसेट करें
        }
    };
    
    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!newMessage && !file) return;
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('message', newMessage);
        if (file) {
            formData.append('attachment', file);
        }

        try {
            const apiCall = isAdmin
                ? apiService.postAdminTicketReply(ticketId, formData)
                : apiService.postUserTicketReply(ticketId, formData);
            
            await apiCall;
            
            setNewMessage('');
            setFile(null);
            if(fileInputRef.current) fileInputRef.current.value = null;
            await fetchTicketData(); // रिप्लाई के बाद डेटा रिफ्रेश करें
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send reply.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!isAdmin) return;
        try {
            await apiService.updateAdminTicketStatus(ticketId, { status: newStatus });
            setTicket(prevTicket => ({ ...prevTicket, status: newStatus }));
            toast.success(`Ticket status updated to ${newStatus}`);
        } catch (err) {
            toast.error('Failed to update status.');
        }
    };

    // ✅✅✅ समाधान: रेंडर लॉजिक का सही क्रम ✅✅✅
    // 1. सबसे पहले लोडिंग स्टेट दिखाएँ
    if (loading) {
        return (
            <div className="ticket-view-container" style={{justifyContent: 'center', alignItems: 'center'}}>
                <p>Loading your ticket...</p>
            </div>
        );
    }
    
    // 2. फिर एरर स्टेट दिखाएँ
    if (error) {
        return (
            <div className="ticket-view-container" style={{justifyContent: 'center', alignItems: 'center'}}>
                <p style={{color: 'red'}}>{error}</p>
            </div>
        );
    }

    // 3. अगर isNew है, तो नया टिकट बनाने का फॉर्म दिखाएँ
    if (isNew) {
        return (
             <div className="ticket-view-container new-ticket-form">
                <div className="ticket-header"><h2>Create New Support Ticket</h2></div>
                <form className="reply-form" onSubmit={handleNewTicketSubmit} style={{padding: '1.5rem'}}>
                    <div className="form-group" style={{marginBottom: '1rem'}}>
                        <label>Subject</label>
                        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Enter a brief subject for your issue" required disabled={isSubmitting}/>
                    </div>
                     <div className="form-group">
                        <label>Message</label>
                        <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Describe your issue in detail..." required disabled={isSubmitting}/>
                    </div>
                    <div className="form-actions">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} disabled={isSubmitting} />
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Ticket'}</button>
                    </div>
                    {file && <p className="file-name" style={{marginTop: '0.5rem'}}>Selected file: {file.name}</p>}
                </form>
            </div>
        );
    }
    
    // 4. अगर सब कुछ ठीक है, लेकिन टिकट नहीं मिला, तो यह मैसेज दिखाएँ
    if (!ticket) {
        return (
            <div className="ticket-view-container" style={{justifyContent: 'center', alignItems: 'center'}}>
                <p>Ticket not found.</p>
            </div>
        );
    }
    
    // 5. अंत में, असली टिकट का व्यू दिखाएँ
    return (
        <div className="ticket-view-container">
            <div className="ticket-header">
                <div>
                    <h2>{ticket.subject}</h2>
                    <span className={`status-badge ${ticket.status.toLowerCase()}`}>{ticket.status}</span>
                </div>
                <button 
                    onClick={() => navigate(isAdmin ? '/admin/tickets' : '/support')} 
                    className="btn-secondary" 
                    style={{padding: '0.5rem 1rem'}}>
                    <i className="fa-solid fa-arrow-left" style={{marginRight: '0.5rem'}}></i>
                    Back to Tickets
                </button>
            </div>
            <div className="chat-area">
                <div className="chat-bubble user">
                    <div className="bubble-header">{isAdmin ? `User (${ticket.user_id})` : 'You'}</div>
                    <p>{ticket.message}</p>
                    <div className="bubble-footer">{new Date(ticket.created_at).toLocaleString()}</div>
                </div>
                {replies.map(reply => (
                    <div key={reply.id} className={`chat-bubble ${reply.user_id === ticket.user_id ? 'user' : 'admin'}`}>
                        <div className="bubble-header">{reply.user_id === ticket.user_id ? (isAdmin ? `User (${reply.user_id})` : 'You') : 'Support Team'}</div>
                        {reply.message && <p>{reply.message}</p>}
                        {reply.attachment && (
                            <div className="attachment">
                                {reply.attachment.type.startsWith('image') ? (
                                    <a href={reply.attachment.url} target="_blank" rel="noopener noreferrer"><img src={reply.attachment.url} alt="attachment" style={{maxWidth: '200px', borderRadius: '8px'}} /></a>
                                ) : (
                                     <a href={reply.attachment.url} target="_blank" rel="noopener noreferrer" className="video-link" style={{display: 'inline-flex', alignItems: 'center', gap: '0.5rem'}}><i className="fa-solid fa-video"></i> View Attachment</a>
                                )}
                            </div>
                        )}
                        <div className="bubble-footer">{new Date(reply.created_at).toLocaleString()}</div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            {ticket.status !== 'CLOSED' && (
                <form className="reply-form" onSubmit={handleReplySubmit}>
                    <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your reply..." disabled={isSubmitting}/>
                    <div className="form-actions">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} disabled={isSubmitting} />
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Send Reply'}</button>
                    </div>
                    {file && <p className="file-name" style={{marginTop: '0.5rem'}}>Selected file: {file.name}</p>}
                </form>
            )}
        </div>
    );
};

export default TicketView;