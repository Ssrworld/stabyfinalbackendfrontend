// frontend/src/pages/admin/TeamTreePage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tree, TreeNode } from 'react-organizational-chart';
import apiService from '../../services/api';
import './Admin.css';
import './TeamTree.css';

// --- ✅ समाधान: OrgNode कंपोनेंट को Placement ID दिखाने के लिए अपडेट किया गया ---
const OrgNode = ({ node, onExpand, onNodeClick }) => {
    const handleExpandClick = (e) => {
        e.stopPropagation(); // नोड पर क्लिक होने से रोकें
        onExpand(node.id, !node.isExpanded);
    };

    return (
        <div className={`node-card ${node.type?.toLowerCase()}`} onClick={() => onNodeClick(node.id)}>
            <div className="node-info">
                <strong>{node.email}</strong>
                {/* --- ✅ समाधान: User ID की जगह Placement ID दिखाएं --- */}
                {/* "PID" का मतलब "Placement ID" है, और यदि यह मौजूद नहीं है तो N/A दिखाएं */}
                <span>(PID: {node.global_placement_id || 'N/A'})</span>
            </div>
            <div className="node-status">Pool: {node.current_pool || 0}</div>
            {node.type && <div className="node-type-badge">{node.type}</div>}
            
            {/* विस्तार बटन */}
            {node.hasChildren && (
                <button onClick={handleExpandClick} className="expand-btn">
                    <i className={`fa-solid ${node.isExpanded ? 'fa-minus' : 'fa-plus'}`}></i>
                </button>
            )}
        </div>
    );
};

// --- मुख्य पेज कंपोनेंट ---
function TeamTreePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // --- सिस्टम स्थिति के लिए स्टेट ---
    const [systemStatus, setSystemStatus] = useState({ nextSponsor: null, queue: [] });

    const fetchDataForUser = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await apiService.getAdminUserMatrix(id);
            const { user, parent, children } = response.data;
            
            setTreeData({
                ...user,
                parent,
                children: children.map(c => ({...c, children: [], isExpanded: false})),
                isExpanded: true
            });

        } catch (error) {
            console.error(`Failed to fetch data for user ${id}`, error);
            setTreeData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSystemStatus = useCallback(async () => {
        try {
            const [slotRes, queueRes] = await Promise.all([
                apiService.getNextAvailableSlot(),
                apiService.getUnplacedQueue()
            ]);
            setSystemStatus({ nextSponsor: slotRes.data.nextSponsor, queue: queueRes.data.queue });
        } catch (error) {
            console.error("Failed to fetch system status:", error);
        }
    }, []);

    useEffect(() => {
        const idToFetch = userId || '2';
        fetchDataForUser(idToFetch);
        fetchSystemStatus();
    }, [userId, fetchDataForUser, fetchSystemStatus]);

    const handleExpand = async (nodeId, expand) => {
        // ट्री में सही नोड को खोजने और अपडेट करने के लिए एक पुनरावर्ती फंक्शन
        const updateNode = async (node) => {
            if (node.id === nodeId) {
                if (expand && node.children.length === 0) { // केवल तभी डेटा लाएं जब बच्चे न हों
                    const response = await apiService.getAdminUserMatrix(node.id);
                    node.children = response.data.children.map(c => ({...c, children: [], isExpanded: false}));
                }
                node.isExpanded = expand;
                return node;
            }
            node.children = await Promise.all(node.children.map(child => updateNode(child)));
            return node;
        };
        const newTreeData = await updateNode({...treeData});
        setTreeData(newTreeData);
    };

    const handleNodeClick = (id) => navigate(`/admin/team-tree/${id}`);
    
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm && !isNaN(searchTerm)) {
            // यहाँ हम यूजर ID से ही सर्च करेंगे क्योंकि प्लेसमेंट आईडी यूनिक नहीं हो सकती
            // लेकिन API यूजर ID के आधार पर डेटा लौटाएगा जिसमें प्लेसमेंट आईडी शामिल होगी।
            navigate(`/admin/team-tree/${searchTerm}`);
        }
    };
    
    // ट्री को रेंडर करने के लिए पुनरावर्ती फंक्शन
    const renderTree = (node) => (
        <TreeNode key={node.id} label={<OrgNode node={node} onExpand={handleExpand} onNodeClick={handleNodeClick} />}>
            {node.isExpanded && node.children.map(child => renderTree(child))}
        </TreeNode>
    );

    if (loading) return <div className="admin-page-container">Loading Team Tree...</div>;
    
    return (
        <div className="admin-page-container">
            <div className="page-header" style={{ alignItems: 'flex-start' }}>
                <div>
                    <h1>Team Tree Explorer</h1>
                    <p style={{marginTop: '-1rem', color: 'var(--text-color-dark)'}}>Click on a user to focus, or use the '+' to expand their downline.</p>
                </div>
                <div className="header-actions" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                            type="number"
                            className="search-input"
                            placeholder="Search by User ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="btn-primary">Search</button>
                    </form>
                    {treeData && treeData.parent && (
                        <button className="btn-secondary" style={{width: '100%'}} onClick={() => navigate(`/admin/team-tree/${treeData.parent.id}`)}>
                            <i className="fa-solid fa-arrow-up"></i> Go Up to {treeData.parent.email}
                        </button>
                    )}
                </div>
            </div>

            {/* सिस्टम स्थिति पैनल */}
            <div className="system-status-panel">
                <h4>System Status (Pool 1)</h4>
                <div className="status-item">
                    <span>Next Available Slot Under:</span>
                    <strong>{systemStatus.nextSponsor ? `${systemStatus.nextSponsor.email} (ID: ${systemStatus.nextSponsor.id})` : 'N/A'}</strong>
                </div>
                <div className="status-item">
                    <span>Next in Queue:</span>
                    <strong>{systemStatus.queue.length > 0 ? `${systemStatus.queue[0].email} (ID: ${systemStatus.queue[0].id})` : 'Queue is empty'}</strong>
                </div>
            </div>

            {treeData ? (
                <div className="tree-wrapper">
                    <Tree
                        lineWidth={'2px'}
                        lineColor={'#3a3a5a'}
                        lineBorderRadius={'10px'}
                        label={<OrgNode node={treeData} onExpand={handleExpand} onNodeClick={handleNodeClick} />}
                    >
                        {treeData.isExpanded && treeData.children.map(child => renderTree(child))}
                    </Tree>
                </div>
            ) : <p>User not found. Please try another ID.</p>}
        </div>
    );
}

export default TeamTreePage;