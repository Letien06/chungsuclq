import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { PACKAGES, INITIAL_TICKER_ITEMS, SAMPLE_HISTORIES } from '../data/packages';
import * as api from '../services/api';
import confetti from 'canvas-confetti';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // 1. Auth State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cslq_user');
    return saved ? JSON.parse(saved) : null;
  });

  // 2. Order Form State
  const [selectedPackageId, setSelectedPackageId] = useState('ruong_skin_ss');
  const [quantity, setQuantity] = useState(1);
  const [friendCode, setFriendCode] = useState('');
  const [isBulk, setIsBulk] = useState(false);
  const [bulkCodesText, setBulkCodesText] = useState('');
  const [note, setNote] = useState('');

  // 3. Order History State
  const [orderHistory, setOrderHistory] = useState(() => {
    const saved = localStorage.getItem('cslq_orders');
    return saved ? JSON.parse(saved) : SAMPLE_HISTORIES;
  });

  // 4. Modal States
  const [activeModal, setActiveModal] = useState(null);
  const [lastCompletedOrder, setLastCompletedOrder] = useState(null);

  // 5. Toast Notifications
  const [toasts, setToasts] = useState([]);

  // 6. Live Ticker state
  const [tickerItems, setTickerItems] = useState(INITIAL_TICKER_ITEMS);

  // 7. Polling refs for active orders
  const pollingRef = useRef(new Map());

  // Sync to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('cslq_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cslq_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('cslq_orders', JSON.stringify(orderHistory));
  }, [orderHistory]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      pollingRef.current.forEach((intervalId) => clearInterval(intervalId));
    };
  }, []);

  // Toast Helper
  const addToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth Methods
  const login = (username, customBalance = 250000) => {
    const newUser = {
      username: username || 'Gamer_VIP',
      displayName: username || 'Chiến Tướng LQ',
      balance: customBalance,
      isVip: true,
      avatar: 'https://cdn-icons-png.flaticon.com/512/3408/3408545.png'
    };
    setUser(newUser);
    addToast('Đăng nhập thành công', `Chào mừng ${newUser.displayName} trở lại!`, 'success');
    closeModal();
  };

  const logout = () => {
    setUser(null);
    addToast('Đã đăng xuất', 'Hẹn gặp lại bạn!', 'info');
  };

  const topUpBalance = (amount) => {
    if (!user) {
      const guestUser = {
        username: 'Khach_Hang',
        displayName: 'Khách Hàng',
        balance: amount,
        isVip: false,
        avatar: 'https://cdn-icons-png.flaticon.com/512/3408/3408545.png'
      };
      setUser(guestUser);
      addToast('Nạp tiền thành công', `Tài khoản đã được cộng ${amount.toLocaleString('vi-VN')}đ`, 'success');
    } else {
      setUser((prev) => ({ ...prev, balance: prev.balance + amount }));
      addToast('Nạp tiền thành công', `Đã cộng ${amount.toLocaleString('vi-VN')}đ vào số dư`, 'success');
    }
    closeModal();
  };

  // Selected package object
  const currentPackage = PACKAGES.find((p) => p.id === selectedPackageId) || PACKAGES[0];

  // Bulk codes count
  const parsedBulkCodes = bulkCodesText
    .split('\n')
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  // Price calculations
  const effectiveQty = isBulk ? Math.max(1, parsedBulkCodes.length || 1) : quantity;
  const isMember = Boolean(user);
  const unitPrice = isMember ? currentPackage.memberPrice : currentPackage.price;
  const originalTotalPrice = currentPackage.price * effectiveQty;
  const totalPrice = unitPrice * effectiveQty;
  const totalBi = currentPackage.bi * effectiveQty;
  const discountAmount = originalTotalPrice - totalPrice;

  // Modals management
  const openModal = (modalName) => setActiveModal(modalName);
  const closeModal = () => setActiveModal(null);

  /**
   * Poll order status from backend
   */
  const startPolling = useCallback((orderId) => {
    // Don't duplicate polling
    if (pollingRef.current.has(orderId)) return;

    const intervalId = setInterval(async () => {
      try {
        const data = await api.getOrderStatus(orderId);

        setOrderHistory((prev) =>
          prev.map((o) => {
            if (o.id !== orderId) return o;

            const biDone = data.biDone || 0;
            const biTarget = data.biTarget || o.bi;
            const progress = biTarget > 0 ? Math.round((biDone / biTarget) * 100) : 0;

            let statusText = 'Đang chờ xử lý...';
            if (data.status === 'processing') {
              statusText = `Đang cày (${biDone}/${biTarget} Bỉ)`;
            } else if (data.status === 'completed') {
              statusText = 'Hoàn thành 100%';
            } else if (data.status === 'failed') {
              statusText = `Thất bại: ${data.error || 'Lỗi không xác định'}`;
            } else if (data.status === 'partial') {
              statusText = `Hoàn thành 1 phần (${biDone}/${biTarget} Bỉ)`;
            }

            return {
              ...o,
              status: data.status,
              statusText,
              progress: Math.min(progress, 100),
              biDone,
              completedAt: data.completedAt || o.completedAt,
            };
          })
        );

        // Stop polling if order is done
        if (['completed', 'failed', 'partial'].includes(data.status)) {
          clearInterval(intervalId);
          pollingRef.current.delete(orderId);

          if (data.status === 'completed') {
            addToast('Hoàn thành cày Bỉ!', `Đơn #${orderId} đã cày xong! Hãy vào game kiểm tra.`, 'success');
          } else if (data.status === 'failed') {
            addToast('Đơn hàng thất bại', `Đơn #${orderId}: ${data.error || 'Lỗi'}`, 'error');
          }
        }
      } catch (err) {
        console.error(`[Polling] Order ${orderId} error:`, err);
      }
    }, 5000); // Poll every 5 seconds

    pollingRef.current.set(orderId, intervalId);
  }, []);

  /**
   * Submit Order - calls real Backend API
   */
  const handleOrderSubmit = async () => {
    // 1. Validation
    if (isBulk) {
      if (parsedBulkCodes.length === 0) {
        addToast('Lỗi nhập mã', 'Vui lòng nhập ít nhất 1 mã mời (Friend Code)!', 'error');
        return;
      }
    } else {
      if (!friendCode.trim()) {
        addToast('Thiếu mã mời', 'Vui lòng nhập Mã Mời (Friend Code) sự kiện Liên Quân!', 'error');
        return;
      }
    }

    // 2. Check balance if user logged in
    if (user && user.balance < totalPrice) {
      addToast('Số dư không đủ', `Bạn còn thiếu ${(totalPrice - user.balance).toLocaleString('vi-VN')}đ.`, 'warning');
      openModal('topup');
      return;
    }

    if (!user) {
      addToast('Yêu cầu đăng nhập', 'Vui lòng đăng nhập hoặc nạp tiền!', 'warning');
      openModal('login');
      return;
    }

    // 3. Map frontend package ID to backend package ID
    const packageMap = {
      'test_the_lsr': 'test_the_lsr',
      'ruong_skin_ss': 'ruong_ss',
      'full_3_ruong': 'full_ruong',
      '25_bi_le': 'ruong_ss',
      'goi_san_sss': 'full_ruong',
      'goi_vip': 'full_ruong',
      'goi_svip': 'full_ruong',
    };
    const backendPackageId = packageMap[currentPackage.id] || 'test_the_lsr';

    const codesList = isBulk ? parsedBulkCodes : [friendCode.trim()];

    // 4. Call Backend API for each code
    try {
      for (const code of codesList) {
        const result = await api.createOrder({
          chungSucCode: code,
          packageId: backendPackageId,
          customerName: user.displayName || user.username,
        });

        const newOrder = {
          id: result.orderId,
          packageId: currentPackage.id,
          packageName: currentPackage.name,
          friendCode: code,
          codes: [code],
          bi: totalBi / codesList.length,
          quantity: 1,
          amount: totalPrice / codesList.length,
          note: note.trim(),
          status: 'queued',
          statusText: 'Đang chờ hệ thống xử lý...',
          progress: 5,
          createdAt: new Date().toLocaleString('vi-VN'),
          completedAt: null,
        };

        // Add to history
        setOrderHistory((prev) => [newOrder, ...prev]);

        // Start polling for this order
        startPolling(result.orderId);

        // Add to ticker
        const newTicker = {
          id: 'tk_' + Date.now(),
          user: (user.displayName || 'Gamer').substring(0, 3) + '***',
          packageName: currentPackage.name,
          bi: totalBi / codesList.length,
          status: 'ĐANG XỬ LÝ',
          price: totalPrice / codesList.length,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        setTickerItems((prev) => [newTicker, ...prev.slice(0, 10)]);
      }

      // Deduct balance
      setUser((prev) => ({ ...prev, balance: prev.balance - totalPrice }));

      // Confetti
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch (e) { /* fallback */ }

      setLastCompletedOrder({
        id: 'BATCH',
        packageName: currentPackage.name,
        bi: totalBi,
        amount: totalPrice,
      });
      openModal('success');
      addToast('Đặt hàng thành công!', `${codesList.length} đơn đang được hệ thống cày tự động!`, 'success');

      // Reset inputs
      setFriendCode('');
      setBulkCodesText('');
      setNote('');
    } catch (err) {
      console.error('[Order] Submit error:', err);
      addToast('Lỗi đặt hàng', err.message || 'Không thể kết nối server', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        topUpBalance,
        packages: PACKAGES,
        selectedPackageId,
        setSelectedPackageId,
        currentPackage,
        quantity,
        setQuantity,
        friendCode,
        setFriendCode,
        isBulk,
        setIsBulk,
        bulkCodesText,
        setBulkCodesText,
        parsedBulkCodes,
        note,
        setNote,
        effectiveQty,
        unitPrice,
        originalTotalPrice,
        totalPrice,
        totalBi,
        discountAmount,
        isMember,
        orderHistory,
        activeModal,
        openModal,
        closeModal,
        lastCompletedOrder,
        toasts,
        addToast,
        removeToast,
        tickerItems,
        handleOrderSubmit
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
