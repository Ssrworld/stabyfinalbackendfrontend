import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../../services/api';
import { toast } from 'react-toastify';
import './Admin.css';

// Status Badge कंपोनेंट का पुन: उपयोग करें
const StatusBadge = ({ status }) => {
    let className = 'status-badge';
    switch (status) {
        case 'OPEN':
            className += ' pending';
            break;
        case 'ANSWERED':
            className += ' active';
            break;
        case 'CLOSED':
            className += ' failed'; // आप इसे ग्रे भी कर सकते हैं
            break;
        default:
            break;
    }
    return <span className={className}>{status}</span>;
};

function ManageTickets() {
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [filter, setFilter] = useState('ALL'); // 'ALL', 'OPEN', 'ANSWERED', 'CLOSED'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiService.getAdminAllTickets()
            .then(response => {
                setTickets(response.data);
                setFilteredTickets(response.data); // शुरू में सभी टिकट दिखाएं
            })
            .catch(err => toast.error("Failed to load support tickets."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (filter === 'ALL') {
            setFilteredTickets(tickets);
        } else {
            setFilteredTickets(tickets.filter(ticket => ticket.status === filter));
        }
    }, [filter, tickets]);

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <h1>Manage Support Tickets</h1>
                <div className="header-actions">
                    <select value={filter} onChange={(e) => setFilter(e.target.value)} className="search-input">
                        <option value="ALL">All Tickets</option>
                        <option value="OPEN">Open</option>
                        <option value="ANSWERED">Answered</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                </div>
            </div>

            {loading ? <p>Loading tickets...</p> : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User Email</th>
                                <th>Subject</th>
                                <th>Status</th>
                                <th>Last Updated</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.length > 0 ? filteredTickets.map(ticket => (
                                <tr key={ticket.id}>
                                    <td>{ticket.email}</td>
                                    <td>{ticket.subject}</td>
                                    <td><StatusBadge status={ticket.status} /></td>
                                    <td>{new Date(ticket.updated_at).toLocaleString()}</td>
                                    <td>
                                        <Link to={`/admin/tickets/${ticket.id}`} className="btn-action">
                                            View & Reply
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>
                                        No tickets found for the selected filter.
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

export default ManageTickets;