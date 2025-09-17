// frontend/src/pages/admin/CommunicationsPage.jsx (FINAL AND GUARANTEED TO WORK)

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';
import './Admin.css';
import './CommunicationsPage.css';

function CommunicationsPage() {
    // Form states
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [showOnHomepage, setShowOnHomepage] = useState(false);

    // List and loading states
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    // Function to fetch announcements from the server
    const fetchAnnouncements = useCallback(() => {
        setIsLoading(true);
        apiService.getAnnouncements()
            .then(response => setAnnouncements(response.data))
            .catch(() => toast.error('Failed to fetch announcements.'))
            .finally(() => setIsLoading(false));
    }, []);

    // Fetch announcements when the component loads
    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);
    
    // Function to reset the form fields
    const resetForm = () => {
        setSubject('');
        setContent('');
        setImage(null);
        setShowOnHomepage(false);
        const fileInput = document.getElementById('imageUpload');
        if(fileInput) fileInput.value = '';
    };

    // --- ✅ YAHI FUNCTION AAPKI SAMASYA KO THEEK KAREGA ---
    const handleCreateAnnouncement = async () => {
        if (!subject || !content) {
            toast.warn('Please provide a subject and content.');
            return;
        }
        setIsSending(true);
        const formData = new FormData();
        formData.append('subject', subject);
        formData.append('content', content);
        formData.append('show_on_homepage', showOnHomepage);
        if (image) {
            formData.append('image', image);
        }

        try {
            // Step 1: API response se naya banaya hua announcement object prapt karein
            const response = await apiService.createAnnouncement(formData);
            const newAnnouncement = response.data.announcement;

            toast.success('Announcement created successfully!');
            
            // Step 2: State ko manual roop se update karein
            // Naye announcement ko maujooda list ke shuru me jod dein
            setAnnouncements(prevAnnouncements => [newAnnouncement, ...prevAnnouncements]);

            // Step 3: Form ko saaf karein
            resetForm();
            
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create announcement.');
        } finally {
            setIsSending(false);
        }
    };

    // ... (baaki ke functions waise hi rahenge)

    const handleSendEmail = async () => {
        if (!subject || !content) {
            toast.warn('Please provide a subject and content for the email.');
            return;
        }
        if (!window.confirm(`Are you sure you want to send this email to ALL active users? This action cannot be undone.`)) {
            return;
        }
        setIsSending(true);
        try {
            const response = await apiService.sendBulkEmail({ subject, content });
            toast.info(response.data.message);
            resetForm();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send email.');
        } finally {
            setIsSending(false);
        }
    };

    const handleStatusToggle = async (id, currentStatus) => {
        const newStatus = currentStatus === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
        try {
            await apiService.updateAnnouncementStatus(id, newStatus);
            toast.success(`Announcement ${newStatus.toLowerCase()}.`);
            fetchAnnouncements();
        } catch (error) {
            toast.error('Failed to update status.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this announcement?')) return;
        try {
            await apiService.deleteAnnouncement(id);
            toast.success('Announcement deleted.');
            setAnnouncements(prev => prev.filter(ann => ann.id !== id));
        } catch (error) {
            toast.error('Failed to delete announcement.');
        }
    };

    return (
        <div className="admin-page-container">
            <h1>Communications</h1>
            <div className="communications-grid">
                <div className="editor-container">
                    <h3>Create Message / Announcement</h3>
                    <div className="form-group"><label htmlFor="subject">Subject</label><input type="text" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={isSending} /></div>
                    <div className="form-group"><label htmlFor="content">Content (HTML allowed)</label><textarea id="content" rows="10" value={content} onChange={(e) => setContent(e.target.value)} disabled={isSending} /></div>
                    <div className="form-group"><label htmlFor="imageUpload">Image (Optional)</label><input type="file" id="imageUpload" accept="image/*" onChange={(e) => setImage(e.target.files[0])} disabled={isSending} /></div>
                    <div className="form-group-checkbox"><input type="checkbox" id="showOnHomepage" checked={showOnHomepage} onChange={(e) => setShowOnHomepage(e.target.checked)} disabled={isSending} /><label htmlFor="showOnHomepage">Show on Homepage</label></div>
                    <div className="editor-actions">
                        <button onClick={handleCreateAnnouncement} className="btn-secondary" disabled={isSending}><i className="fa-solid fa-bullhorn"></i> Create Announcement</button>
                        <button onClick={handleSendEmail} className="btn-primary" disabled={isSending}>{isSending ? 'Processing...' : <><i className="fa-solid fa-paper-plane"></i> Send Email to All Users</>}</button>
                    </div>
                </div>
                <div className="announcements-container">
                    <h3>Recent Announcements</h3>
                    {isLoading ? <p>Loading...</p> : (
                        <div className="announcements-list">
                            {announcements.length > 0 ? announcements.map(ann => (
                                <div className={`announcement-item ${ann.status === 'ARCHIVED' ? 'archived' : ''}`} key={ann.id}>
                                    {ann.image_url && <img src={ann.image_url} alt={ann.subject} className="announcement-image" />}
                                    <h4>{ann.subject}</h4>
                                    <div className="announcement-meta">
                                        <span>{new Date(ann.created_at).toLocaleString()}</span>
                                        {ann.show_on_homepage && <span className="homepage-badge"><i className="fa-solid fa-house"></i> Homepage</span>}
                                    </div>
                                    <div className="announcement-content" dangerouslySetInnerHTML={{ __html: ann.content }} />
                                    <div className="announcement-actions">
                                        <button onClick={() => handleStatusToggle(ann.id, ann.status)} className="btn-action-sm toggle">
                                            <i className={`fa-solid ${ann.status === 'PUBLISHED' ? 'fa-eye-slash' : 'fa-eye'}`}></i> {ann.status === 'PUBLISHED' ? 'Archive' : 'Publish'}
                                        </button>
                                        <button onClick={() => handleDelete(ann.id)} className="btn-action-sm delete">
                                            <i className="fa-solid fa-trash"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            )) : <p>No announcements found.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CommunicationsPage;
