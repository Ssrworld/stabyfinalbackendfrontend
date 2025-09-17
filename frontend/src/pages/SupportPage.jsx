import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { toast } from 'react-toastify';
// हम एडमिन की CSS का पुन: उपयोग करेंगे क्योंकि यह टेबल के लिए अच्छी है
import './admin/Admin.css'; 

// Status Badge के लिए एक छोटा कंपोनेंट
const StatusBadge = ({ status }) => {
    let className = 'status-badge';
    switch (status) {
        case 'OPEN':
            className += ' pending'; // पीला रंग
            break;
        case 'ANSWERED':
            className += ' active'; // हरा रंग
            break;
        case 'CLOSED':
            className += ' failed'; // लाल रंग (या आप ग्रे बना सकते हैं)
            break;
        default:
            break;
    }
    return <span className={className}>{status}</span>;
};

function SupportPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const response = await apiService.getUserTickets();
                setTickets(response.data);
            } catch (err) {
                toast.error("Failed to fetch your support tickets.");
                console.error("Failed to fetch tickets", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    return (
        <div className="admin-page-container" style={{maxWidth: '1000px', margin: '2rem auto'}}>
            <div className="page-header">
                <h1>My Support Tickets</h1>
                <button onClick={() => navigate('/support/ticket/new')} className="btn-primary">
                    <i className="fa-solid fa-plus" style={{marginRight: '0.5rem'}}></i>
                    Create New Ticket
                </button>
            </div>

            {loading ? <p>Loading your tickets...</p> : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Status</th>
                                <th>Last Updated</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.length > 0 ? tickets.map(ticket => (
                                <tr key={ticket.id}>
                                    <td>{ticket.subject}</td>
                                    <td><StatusBadge status={ticket.status} /></td>
                                    <td>{new Date(ticket.updated_at).toLocaleString()}</td>
                                    <td>
                                        <Link to={`/support/ticket/${ticket.id}`} className="btn-action">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>
                                        You have not created any support tickets yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default SupportPage;