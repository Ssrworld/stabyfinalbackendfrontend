// frontend/src/pages/admin/SettingsPage.jsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiService from '../../services/api';
import './Admin.css'; // हम मौजूदा स्टाइल का उपयोग करेंगे

function SettingsPage() {
    const [settings, setSettings] = useState({
        promoter_referral_commission_usdt: '0.00',
        promoter_milestones_config: '{}',
        promoter_team_commission_usdt: '0.00' // टीम कमीशन के लिए नया फील्ड
    });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        apiService.getAdminSettings()
            .then(res => {
                const loadedSettings = res.data;
                // मील के पत्थर की कॉन्फ़िगरेशन को सुंदर प्रिंट (pretty-print) करें
                const formattedMilestones = JSON.stringify(JSON.parse(loadedSettings.promoter_milestones_config || '{}'), null, 2);
                
                setSettings({
                    promoter_referral_commission_usdt: loadedSettings.promoter_referral_commission_usdt || '0.00',
                    promoter_team_commission_usdt: loadedSettings.promoter_team_commission_usdt || '0.00',
                    promoter_milestones_config: formattedMilestones,
                });
            })
            .catch(() => toast.error('Failed to load settings.'))
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // भेजने से पहले मील के पत्थर के JSON को मान्य करें
            JSON.parse(settings.promoter_milestones_config);
            
            const settingsToSave = {
                ...settings,
                // सुनिश्चित करें कि JSON बिना स्पेस के एक लाइन में भेजा जाए
                promoter_milestones_config: JSON.stringify(JSON.parse(settings.promoter_milestones_config))
            };

            await apiService.updateAdminSettings(settingsToSave);
            toast.success('Settings saved successfully!');
        } catch (error) {
            if (error instanceof SyntaxError) {
                toast.error('Invalid JSON format in Milestones Configuration.');
            } else {
                toast.error(error.response?.data?.message || 'Failed to save settings.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="admin-page-container">Loading settings...</div>;

    return (
        <div className="admin-page-container">
            <h1>System Settings</h1>
            <p className="page-description">Manage commissions and other system-wide settings here.</p>
            
            <div className="admin-form-container" style={{ maxWidth: '800px' }}>
                <h3>Promoter Settings</h3>
                
                <div className="form-group">
                    <label htmlFor="promoter_team_commission_usdt">
                        Team Activation Commission (USDT)
                    </label>
                    <input
                        type="number"
                        id="promoter_team_commission_usdt"
                        name="promoter_team_commission_usdt"
                        value={settings.promoter_team_commission_usdt}
                        onChange={handleChange}
                        disabled={isSaving}
                    />
                    <small>When any user in a Promoter's referral downline activates, the closest upline Promoter will earn this amount.</small>
                </div>

                <div className="form-group">
                    <label htmlFor="promoter_milestones_config">
                        Token Bonus Milestones (JSON format)
                    </label>
                    <textarea
                        id="promoter_milestones_config"
                        name="promoter_milestones_config"
                        value={settings.promoter_milestones_config}
                        onChange={handleChange}
                        rows="12"
                        disabled={isSaving}
                        style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                    />
                    <small>
                        Format: {`{"<referral_count>": <token_amount>, ...}`}. Example: {`{"10": 1500, "25": 4000}`}
                    </small>
                </div>
                
                <button onClick={handleSave} className="btn-primary" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}

export default SettingsPage;