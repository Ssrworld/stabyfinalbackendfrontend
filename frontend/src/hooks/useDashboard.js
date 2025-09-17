// frontend/src/hooks/useDashboard.js (BINA DEBUG LOG KE)

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';

export const useDashboard = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();

    const [statsData, setStatsData] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [promoterData, setPromoterData] = useState(null);
    const [milestonesConfig, setMilestonesConfig] = useState({});

    const [copied, setCopied] = useState({ link: false, address: false, contract: false });
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showUpdateWalletModal, setShowUpdateWalletModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showClaimRewardModal, setShowClaimRewardModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const dashboardResponse = await apiService.getDashboardData();

            // --- ✅ YAHAN SE DEBUG WALI console.log LINE HATA DI GAYI HAI ---

            const userData = { ...dashboardResponse.data, isAdmin: dashboardResponse.data.id === 1 };
            setUser(userData);

            const promises = [
                apiService.getPublicStats(),
                apiService.getLatestAnnouncements()
            ];

            if (userData.role === 'PROMOTER') {
                promises.push(apiService.getPromoterStats());
            }

            const responses = await Promise.all(promises);
            
            setStatsData(responses[0].data);
            setAnnouncements(responses[1].data);

            if (userData.role === 'PROMOTER') {
                const promoterStats = responses[2].data;
                setPromoterData(promoterStats);
                setMilestonesConfig(promoterStats.milestonesConfig || {});
            }

        } catch (err) {
            console.error("Error fetching page data:", err);
            if (err.response?.status === 401) {
                toast.error("Your session has expired. Please log in again.");
                navigate('/login');
            }
            setError('Could not load dashboard data.');
        } finally {
            setLoading(false);
        }
    }, [navigate, setUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        toast.info(`${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard!`);
        setCopied(prev => ({ ...prev, [type]: true }));
        setTimeout(() => setCopied(prev => ({ ...prev, [type]: false })), 2000);
    };

    const handleWithdrawSubmit = async (amount) => {
        setIsSubmitting(true);
        try {
            const response = await apiService.requestWithdrawal({ amount });
            toast.success(response.data.message);
            setShowWithdrawModal(false);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Request failed.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleUpdateWalletSubmit = async (payout_wallet) => {
        setIsSubmitting(true);
        try {
            await apiService.updatePayoutWallet({ payout_wallet });
            toast.success('Payout wallet updated successfully.');
            setShowUpdateWalletModal(false);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleActivate = async () => {
        if (isActivating) return;
        setIsActivating(true);
        try {
            const response = await apiService.activateAccount();
            toast.success(response.data.message);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Activation failed.');
        } finally {
            setIsActivating(false);
        }
    };

    const handleTransferSubmit = async (transferData) => {
        setIsTransferring(true);
        try {
            const response = await apiService.transferFunds(transferData);
            toast.success(response.data.message);
            setShowTransferModal(false);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Transfer failed.');
        } finally {
            setIsTransferring(false);
        }
    };

    const handleClaimRewardSubmit = async (walletAddress) => {
        setIsClaiming(true);
        try {
            const response = await apiService.claimStblReward({ walletAddress });
            toast.success(response.data.message);
            setShowClaimRewardModal(false);
            await fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Claiming reward failed.');
        } finally {
            setIsClaiming(false);
        }
    };

    return {
        userData: user,
        statsData,
        announcements,
        loading: loading || !user.id,
        error,
        promoterData,
        milestonesConfig,
        copied,
        showWithdrawModal, setShowWithdrawModal,
        showUpdateWalletModal, setShowUpdateWalletModal,
        showTransferModal, setShowTransferModal,
        showClaimRewardModal, setShowClaimRewardModal,
        isSubmitting,
        isActivating,
        isTransferring,
        isClaiming,
        handleCopy,
        handleWithdrawSubmit,
        handleUpdateWalletSubmit,
        handleActivate,
        handleTransferSubmit,
        handleClaimRewardSubmit,
        fetchData,
    };
};