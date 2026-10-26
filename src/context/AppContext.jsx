import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { PACKAGES, BANK_PAYMENT_INFO } from '../data/packages';
import * as api from '../services/api';
import { signInWithGoogle, signOutUser, getCurrentUserIdToken } from '../services/firebaseAuth';
import confetti from 'canvas-confetti';
import {
  isValidChungSucCode,
  normalizeChungSucCode,
  normalizeChungSucCodesText,
  parseChungSucCodes,
} from '../utils/chungSucCode';

const AppContext = createContext();

// Browser storage can contain stale/truncated data (for example after a
// deploy or an interrupted write). Never let one malformed localStorage
// value crash the whole React tree; fall back to the safe default instead.
const readStoredJson = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key);
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch (error) {
    console.warn(`[Storage] Ignoring invalid ${key} value`, error);
    try { localStorage.removeItem(key); } catch (_) { /* storage may be unavailable */ }
    return fallback;
  }
};

export const AppProvider = ({ children }) => {
  // 1. Auth State
  const [user, setUser] = useState(() => {
    const parsed = readStoredJson('cslq_user', null);
    if (!parsed || typeof parsed !== 'object') return null;
    // Remove the old demo grant from browser sessions created before the
    // zero-balance policy. Verified top-ups are not stored in this client
    // object, so the legacy 250,000 value is never authoritative.
    if (Number(parsed?.balance) === 250000 && !parsed?.balanceSource) {
      return { ...parsed, balance: 0 };
    }
    return parsed;
  });

  // 2. Order Form State
  const [selectedPackageId, setSelectedPackageId] = useState('test_the_lsr');
  const [quantity, setQuantity] = useState(1);
  const [friendCode, setFriendCode] = useState('');
  const [isBulk, setIsBulk] = useState(false);
  const [bulkCodesText, setBulkCodesText] = useState('');
  const [note, setNote] = useState('');

  // 3. Order History State
  // Order history is server-owned. Do not seed a new browser with demo orders.
  const [orderHistory, setOrderHistory] = useState(() => {
    const saved = readStoredJson('cslq_orders', []);
    return Array.isArray(saved) ? saved.filter((order) => order && order.id && order.userId) : [];
  });

  // 4. Modal States
  const [activeModal, setActiveModal] = useState(null);
  const [lastCompletedOrder, setLastCompletedOrder] = useState(null);

  // 5. Toast Notifications
  const [toasts, setToasts] = useState([]);

  // 6. Live Ticker state
  const [tickerItems, setTickerItems] = useState([]);

  // 7. Polling refs for active orders
  const pollingRef = useRef(new Map());
  const submittingOrderRef = useRef(false);

  // Sync to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('cslq_user', JSON.stringify(user));
      if (user.uid) {
        localStorage.setItem('cslq_user_' + user.uid, JSON.stringify(user));
      }
    } else {
      localStorage.removeItem('cslq_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('cslq_orders', JSON.stringify(orderHistory));
  }, [orderHistory]);

  // Replace any legacy/local placeholder history with the authenticated
  // user's real Firestore orders. Anonymous users must see an empty history.
  useEffect(() => {
    let cancelled = false;
    if (!user?.uid) {
      setOrderHistory([]);
      try { localStorage.removeItem('cslq_orders'); } catch (_) { /* ignore */ }
      return undefined;
    }
    api.listOrders({ limit: 50 })
      .then((data) => {
        if (cancelled) return;
        const realOrders = (data.orders || []).map((order) => {
          const target = Number(order.biTarget || order.totalBi || order.bi || 0);
          const done = Number(order.biDone || (order.status === 'completed' ? target : 0));
          const progress = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
          const statusText = order.status === 'completed'
            ? 'Hoàn thành'
            : order.status === 'failed'
              ? `Thất bại: ${order.error || 'Lỗi không xác định'}`
              : order.status === 'partial'
                ? `Hoàn thành 1 phần (${done}/${target} Vé nhảy)`
                : order.status === 'processing'
                  ? `Đang cày (${done}/${target} Vé nhảy)`
                  : 'Đang chờ hệ thống xử lý...';
          return {
            ...order,
            friendCode: order.chungSucCode || order.friendCode || '',
            packageName: order.packageName || order.packageId || 'Gói dịch vụ',
            bi: target,
            biDone: done,
            amount: Number(order.amount ?? order.price ?? 0),
            progress,
            statusText,
            createdAt: order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '—',
          };
        });
        setOrderHistory(realOrders);
        setTickerItems(realOrders.slice(0, 10).map((order) => ({
          id: `order-${order.id}`,
          user: `${String(order.customerName || user.displayName || 'Khách').slice(0, 3)}***`,
          packageName: order.packageName,
          code: order.friendCode,
          bi: order.bi,
          status: order.status === 'completed' ? 'HOÀN THÀNH' : 'ĐANG XỬ LÝ',
          price: order.amount,
          time: order.createdAt,
        })));
      })
      .catch((error) => console.warn('[History] Could not load real orders:', error));
    return () => { cancelled = true; };
  }, [user?.uid]);

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
  const loginWithGoogle = async () => {
    try {
      const googleUser = await signInWithGoogle();
      const savedUser = localStorage.getItem('cslq_user_' + googleUser.uid);
      // A new Firebase account must start at zero. Credit is only changed by
      // a verified top-up/order flow; never grant a demo balance on sign-in.
      const savedProfile = readStoredJson('cslq_user_' + googleUser.uid, null);
      const existingBalance = savedProfile && Number(savedProfile.balance) !== 250000
        ? Number(savedProfile.balance || 0)
        : 0;

      const newUser = {
        uid: googleUser.uid,
        email: googleUser.email,
        username: googleUser.email.split('@')[0],
        displayName: googleUser.displayName,
        avatar: googleUser.avatar,
        balance: existingBalance,
        isVip: false,
      };

      setUser(newUser);
      localStorage.setItem('cslq_user_' + googleUser.uid, JSON.stringify(newUser));
      try {
        const balanceData = await api.getMyBalance();
        const serverBalance = Number(balanceData?.balance || 0);
        const syncedUser = { ...newUser, balance: serverBalance, balanceSource: 'server' };
        setUser(syncedUser);
        localStorage.setItem('cslq_user_' + googleUser.uid, JSON.stringify(syncedUser));
      } catch (balanceError) {
        console.warn('[Auth] Could not load server balance:', balanceError);
      }
      addToast('Đăng nhập thành công', `Chào mừng ${newUser.displayName}!`, 'success');
      closeModal();
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') return;
      addToast('Lỗi đăng nhập Google', error.message || 'Không thể đăng nhập Google', 'error');
    }
  };

  const login = (username, customBalance = 0) => {
    const newUser = {
      username: username || 'Gamer_VIP',
      displayName: username || 'Chiến Tướng LQ',
      balance: customBalance,
      isVip: false,
      avatar: 'https://cdn-icons-png.flaticon.com/512/3408/3408545.png'
    };
    setUser(newUser);
    addToast('Đăng nhập thành công', `Chào mừng ${newUser.displayName} trở lại!`, 'success');
    closeModal();
  };

  const logout = async () => {
    try {
      await signOutUser();
    } catch (e) { /* ignore */ }
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

  // Dynamic packages & siteInfo state
  const [packages, setPackages] = useState(PACKAGES);
  const [siteInfo, setSiteInfo] = useState({
    brandPrimary: 'CHUNGSUC',
    brandAccent: 'LIENQUAN',
    brandDomain: '.COM',
    brandSubtitle: 'SỰ KIỆN CHUNG SỨC • UY TÍN • SIÊU TỐC',
    footerTitle: 'CHUNGSUCLIENQUAN.COM',
    footerSubtitle: 'Hệ Thống Cày Tự Động Siêu Tốc',
    pageTitle: 'CHUNGSUCLIENQUAN.COM - Dịch Vụ Cày Chung Sức Liên Quân Tự Động Siêu Tốc',
    zaloUrl: 'https://zalo.me',
    supportHotline: '0988.776.655',
  });
  const [paymentInfo, setPaymentInfo] = useState(BANK_PAYMENT_INFO);

  useEffect(() => {
    const fallbackTitle = `${siteInfo?.brandPrimary || 'CHUNGSUC'}${siteInfo?.brandAccent || 'LIENQUAN'}${siteInfo?.brandDomain || '.COM'} - Dịch Vụ Cày Chung Sức Liên Quân Tự Động Siêu Tốc`;
    document.title = String(siteInfo?.pageTitle || fallbackTitle).trim();
  }, [siteInfo]);

  // Fetch dynamic packages and prices from backend
  useEffect(() => {
    api.getPublicPackages()
      .then((data) => {
        if (!data || !data.packages) return;
        const pkgList = Object.values(data.packages);
        if (pkgList.length === 0) return;
        setPackages(pkgList);
        // A package can be removed from Admin after the storefront has
        // initialized. Keep the selection pointing at an available package
        // so the deleted ID cannot remain active in the order form.
        setSelectedPackageId((previousId) => (
          pkgList.some((pkg) => pkg.id === previousId) ? previousId : pkgList[0].id
        ));
      })
      .catch((err) => {
        console.warn('Could not load dynamic settings, using default packages:', err);
      });

    api.getPublicSiteInfo()
      .then((data) => {
        if (data && data.siteInfo) setSiteInfo((previous) => ({ ...previous, ...data.siteInfo }));
      })
      .catch((err) => {
        console.warn('Could not load public site info, using defaults:', err);
      });

    api.getPublicPaymentInfo()
      .then((data) => {
        if (data && data.paymentInfo) setPaymentInfo((previous) => ({ ...previous, ...data.paymentInfo }));
      })
      .catch((err) => {
        console.warn('Could not load public payment info, using defaults:', err);
      });

    // Admin sessions still receive the full settings payload (including
    // customized branding/payment info). Public storefront sessions get a
    // 401 here and safely keep the bundled defaults.
    api.getSettings()
      .then((data) => {
        if (data && data.siteInfo) setSiteInfo(data.siteInfo);
        if (!data || !data.paymentInfo) return;
        const serverPaymentInfo = data.paymentInfo;
        const legacyPrefix = ['NAP', 'CSLQ'].includes(String(serverPaymentInfo.transferPrefix || '').trim().toUpperCase());
        setPaymentInfo({
          ...BANK_PAYMENT_INFO,
          ...serverPaymentInfo,
          transferPrefix: legacyPrefix ? 'UNGHO' : (serverPaymentInfo.transferPrefix || 'UNGHO'),
        });
      })
      .catch(() => { /* Full settings are admin-only; public defaults remain active. */ });
  }, []);

  // Selected package object
  const currentPackage = packages.find((p) => p.id === selectedPackageId) || packages[0] || PACKAGES[0];

  // Bulk codes count
  const parsedBulkLines = parseChungSucCodes(bulkCodesText);
  const invalidBulkCodes = parsedBulkLines.filter((code) => !isValidChungSucCode(code));
  const parsedBulkCodes = parsedBulkLines.filter(isValidChungSucCode);

  // Price calculations
  const effectiveQty = isBulk ? Math.max(1, parsedBulkCodes.length || 1) : quantity;
  const unitPrice = currentPackage.price ?? 0;
  const originalTotalPrice = (currentPackage.price ?? 0) * effectiveQty;
  const totalPrice = unitPrice * effectiveQty;
  const totalBi = (currentPackage.bi ?? currentPackage.totalBi ?? 38) * effectiveQty;
  const discountAmount = 0;

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
              statusText = `Đang cày (${biDone}/${biTarget} Vé nhảy)`;
            } else if (data.status === 'completed') {
              statusText = 'Hoàn thành 100%';
            } else if (data.status === 'failed') {
              statusText = `Thất bại: ${data.error || 'Lỗi không xác định'}`;
            } else if (data.status === 'partial') {
              statusText = `Hoàn thành 1 phần (${biDone}/${biTarget} Vé nhảy)`;
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
            addToast('Hoàn thành cày Vé nhảy!', `Đơn #${orderId} đã cày xong! Hãy vào game kiểm tra.`, 'success');
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
    const normalizedFriendCode = normalizeChungSucCode(friendCode);

    // 1. Validation
    if (isBulk) {
      if (parsedBulkCodes.length === 0 && invalidBulkCodes.length === 0) {
        addToast('Lỗi nhập mã', 'Vui lòng nhập ít nhất 1 mã mời (Friend Code)!', 'error');
        return;
      }
      if (invalidBulkCodes.length > 0) {
        addToast('Mã không hợp lệ', `Mỗi mã phải gồm đúng 10 ký tự chữ và số. Kiểm tra: ${invalidBulkCodes.join(', ')}`, 'error');
        return;
      }
    } else {
      if (!normalizedFriendCode) {
        addToast('Thiếu mã mời', 'Vui lòng nhập mã Chung Sức của sự kiện Liên Quân!', 'error');
        return;
      }
      if (!isValidChungSucCode(normalizedFriendCode)) {
        addToast('Mã không hợp lệ', 'Mã phải gồm đúng 10 ký tự chữ và số. Bạn có thể dán nguyên câu chia sẻ, hệ thống sẽ tự tách mã.', 'error');
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

    // A stale demo/localStorage user is not proof of authentication. Verify
    // the live Firebase session before checking balance or creating anything.
    const idToken = await getCurrentUserIdToken();
    if (!idToken) {
      setUser(null);
      addToast('Yêu cầu đăng nhập Google', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', 'warning');
      openModal('login');
      return;
    }

    if (submittingOrderRef.current) {
      addToast('Đang gửi đơn', 'Đơn của bạn đang được gửi, vui lòng chờ một chút.', 'info');
      return;
    }
    submittingOrderRef.current = true;

    // Package IDs are shared by the frontend settings and the backend.
    // Keep legacy aliases for old settings documents only.
    const legacyPackageMap = {
      goi_vip: 'goi_san_sss_vip',
      goi_svip: 'goi_san_sss_svip',
      ruong_ss: 'ruong_skin_ss',
      full_ruong: 'full_3_ruong',
    };
    const backendPackageId = legacyPackageMap[currentPackage.id] || currentPackage.id || 'test_the_lsr';

    const codesList = isBulk ? parsedBulkCodes : [normalizedFriendCode];

    // 4. Call Backend API for each code
    try {
      let serverBalanceAfter = null;
      for (const code of codesList) {
        const result = await api.createOrder({
          chungSucCode: code,
          packageId: backendPackageId,
          quantity: isBulk ? 1 : quantity,
        });
        if (Number.isFinite(Number(result.balanceAfter))) serverBalanceAfter = Number(result.balanceAfter);

        const newOrder = {
          id: result.orderId,
          userId: user.uid,
          customerName: user.displayName || user.email,
          packageId: currentPackage.id,
          packageName: currentPackage.name,
          friendCode: code,
          codes: [code],
          bi: totalBi / codesList.length,
          quantity: isBulk ? 1 : quantity,
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
      setUser((prev) => ({
        ...prev,
        balance: serverBalanceAfter === null ? Math.max(0, prev.balance - totalPrice) : serverBalanceAfter,
        balanceSource: 'server',
      }));

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
    } finally {
      submittingOrderRef.current = false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        logout,
        topUpBalance,
        packages,
        siteInfo,
        paymentInfo,
        selectedPackageId,
        setSelectedPackageId,
        currentPackage,
        quantity,
        setQuantity,
        friendCode,
        setFriendCode: (value) => setFriendCode(normalizeChungSucCode(value)),
        isBulk,
        setIsBulk,
        bulkCodesText,
        setBulkCodesText: (value) => setBulkCodesText((previous) =>
          normalizeChungSucCodesText(typeof value === 'function' ? value(previous) : value)
        ),
        parsedBulkCodes,
        invalidBulkCodes,
        note,
        setNote,
        effectiveQty,
        unitPrice,
        originalTotalPrice,
        totalPrice,
        totalBi,
        discountAmount,
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
