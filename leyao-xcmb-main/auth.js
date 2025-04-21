/**
 * 登录验证接口 - auth.js
 * 负责登录配置、登录功能实现、验证和数据库操作
 * 提供统一接口供其它模块调用
 */

// 定义全局命名空间，避免污染全局变量
window.AuthService = (function() {
    // Firebase 模块
    let app;
    let database;
    let dbRef;
    
    // Firebase配置
    const firebaseConfig = {
        apiKey: "AIzaSyA0FUYw_qt1PRBklf-QvJscHFDh7oLKhb4",
        authDomain: "server-d137e.firebaseapp.com",
        databaseURL: "https://server-d137e-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "server-d137e",
        storageBucket: "server-d137e.firebasestorage.app",
        messagingSenderId: "294497125389",
        appId: "1:294497125389:web:ae3426d6a424320f28c144",
        measurementId: "G-7C1Z271Y9J"
    };
    
    // DOM 元素引用
    let loginForm;
    let usernameInput;
    let passwordInput;
    let loginBtn;
    let loading;
    let message;
    let usernameError;
    let passwordError;
    
    // 初始化Firebase
    async function initFirebase() {
        if (database) return true; // 已初始化
        
        try {
            // 动态导入Firebase模块
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js");
            const { getDatabase, ref } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js");
            
            // 初始化Firebase
            app = initializeApp(firebaseConfig);
            database = getDatabase(app);
            dbRef = ref(database);
            
            return true;
        } catch (error) {
            console.error("Firebase初始化失败:", error);
            return false;
        }
    }
    
    // 初始化登录页面
    function initLoginPage() {
        // 仅在登录页面执行
        if (!window.location.pathname.includes('index.html') && 
            window.location.pathname !== '/' && 
            !window.location.pathname.endsWith('/')) {
            return;
        }
        
        // 获取DOM元素
        loginForm = document.getElementById('loginForm');
        usernameInput = document.getElementById('username');
        passwordInput = document.getElementById('password');
        loginBtn = document.getElementById('loginBtn');
        loading = document.getElementById('loading');
        message = document.getElementById('message');
        usernameError = document.getElementById('usernameError');
        passwordError = document.getElementById('passwordError');
        
        // 绑定事件
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
        
        // 检查登录状态
        checkLoginStatus();
    }
    
    // 表单验证
    function validateForm() {
        let isValid = true;

        if (!usernameInput.value.trim()) {
            usernameError.style.display = 'block';
            isValid = false;
        } else {
            usernameError.style.display = 'none';
        }

        if (passwordInput.value.length < 6) {
            passwordError.style.display = 'block';
            isValid = false;
        } else {
            passwordError.style.display = 'none';
        }

        return isValid;
    }
    
    // 处理登录提交
    async function handleLogin(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // 显示加载状态
        loginBtn.disabled = true;
        loading.style.display = 'block';
        message.textContent = '';
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        try {
            await initFirebase();
            const { get, child, set, ref } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js");
            
            // 检查用户是否存在
            const userSnapshot = await get(child(dbRef, `denglu/${username}`));
            
            if (userSnapshot.exists()) {
                // 用户存在，验证密码
                const userData = userSnapshot.val();
                
                if (userData.password === password) {
                    // 登录成功
                    message.textContent = '登录成功，正在跳转...';
                    message.style.color = '#4caf50';
                    
                    // 保存登录状态
                    saveLoginState(username);
                    
                    // 更新最后登录时间
                    await set(ref(database, `denglu/${username}/lastLogin`), new Date().toISOString());
                    
                    // 重定向到设计页面
                    setTimeout(() => {
                        window.location.href = 'sheji.html';
                    }, 1000);
                } else {
                    // 密码错误
                    message.textContent = '密码错误，请重试';
                    message.style.color = '#e53935';
                }
            } else {
                // 用户不存在，注册新用户
                message.textContent = '用户不存在，正在注册新用户...';
                message.style.color = '#ff9800';
                
                // 创建新用户
                await set(ref(database, `denglu/${username}`), {
                    username: username,
                    password: password,
                    registerTime: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                });
                
                // 保存登录状态
                saveLoginState(username);
                
                // 显示成功消息
                setTimeout(() => {
                    message.textContent = '注册成功，正在跳转...';
                    message.style.color = '#4caf50';
                    
                    // 重定向到设计页面
                    setTimeout(() => {
                        window.location.href = 'sheji.html';
                    }, 1000);
                }, 1000);
            }
        } catch (error) {
            // 处理错误
            console.error('登录/注册失败:', error);
            message.textContent = `出错了: ${error.message}`;
            message.style.color = '#e53935';
        } finally {
            // 重置加载状态
            loginBtn.disabled = false;
            loading.style.display = 'none';
        }
    }
    
    // 保存登录状态
    function saveLoginState(username) {
        const userInfo = {
            username: username,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
    }
    
    // 检查是否已登录
    function isLoggedIn() {
        const userInfo = localStorage.getItem('userInfo');
        return !!userInfo; // 转换为布尔值
    }
    
    // 获取当前登录用户信息
    function getCurrentUser() {
        if (!isLoggedIn()) {
            return null;
        }
        
        try {
            return JSON.parse(localStorage.getItem('userInfo'));
        } catch (error) {
            console.error("获取用户信息失败:", error);
            return null;
        }
    }
    
    // 获取用户名
    function getUsername() {
        const user = getCurrentUser();
        return user ? user.username : null;
    }
    
    // 登出当前用户
    function logout() {
        localStorage.removeItem('userInfo');
        // 重定向到登录页
        window.location.href = 'index.html';
    }
    
    // 检查登录状态并处理重定向
    function checkLoginStatus() {
        // 如果在登录页且已登录，重定向到设计页面
        if (isLoggedIn() && 
            (window.location.pathname.includes('index.html') || 
             window.location.pathname === '/' || 
             window.location.pathname.endsWith('/'))) {
            
            // 检查是否有存储的重定向URL
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
            if (redirectUrl) {
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
            } else {
                window.location.href = 'sheji.html';
            }
        }
    }
    
    /**
     * 从数据库获取用户数据
     * @param {string} path 数据路径 (可选，默认为当前用户路径)
     * @returns {Promise<Object|null>} 用户数据或null(获取失败)
     */
    async function getUserData(path = '') {
        if (!isLoggedIn()) {
            console.error("未登录，无法获取用户数据");
            return null;
        }
        
        try {
            await initFirebase();
            const { get, child } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js");
            
            const username = getUsername();
            // 构建数据路径
            const dataPath = path ? `denglu/${username}/${path}` : `denglu/${username}`;
            
            // 从数据库获取数据
            const snapshot = await get(child(dbRef, dataPath));
            
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                console.log("没有找到数据");
                return null;
            }
        } catch (error) {
            console.error("获取用户数据失败:", error);
            return null;
        }
    }
    
    /**
     * 保存用户数据到数据库
     * @param {Object} data 要保存的数据
     * @param {string} path 数据路径 (可选，默认为用户根路径)
     * @returns {Promise<boolean>} 是否成功
     */
    async function saveUserData(data, path = '') {
        if (!isLoggedIn()) {
            console.error("未登录，无法保存用户数据");
            return false;
        }
        
        try {
            await initFirebase();
            const { set, ref } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js");
            
            const username = getUsername();
            // 构建数据路径
            const dataPath = path ? `denglu/${username}/${path}` : `denglu/${username}`;
            
            // 保存数据到数据库
            await set(ref(database, dataPath), data);
            return true;
        } catch (error) {
            console.error("保存用户数据失败:", error);
            return false;
        }
    }
    
    /**
     * 验证页面访问权限 (未登录时重定向到登录页)
     * @param {boolean} redirect 是否重定向 (默认为true)
     * @returns {boolean} 是否有权限访问
     */
    function requireLogin(redirect = true) {
        const loggedIn = isLoggedIn();
        
        if (!loggedIn && redirect) {
            // 保存当前URL，以便登录后返回
            const currentPage = window.location.href;
            sessionStorage.setItem('redirectAfterLogin', currentPage);
            
            // 重定向到登录页
            window.location.href = 'index.html';
        }
        
        return loggedIn;
    }
    
    /**
     * 获取所有用户列表
     * 注意: 此函数仅用于管理员功能
     * @returns {Promise<Object|null>} 用户列表
     */
    async function getAllUsers() {
        try {
            await initFirebase();
            const { get, child } = await import("https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js");
            
            // 从数据库获取所有用户数据
            const snapshot = await get(child(dbRef, 'denglu'));
            
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                console.log("没有找到用户数据");
                return null;
            }
        } catch (error) {
            console.error("获取用户列表失败:", error);
            return null;
        }
    }
    
    // 初始化代码
    function init() {
        // 初始化登录页面
        initLoginPage();
        
        // 在所有页面检查登录状态
        if (isLoggedIn()) {
            // 检查是否有存储的重定向URL
            const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
            if (redirectUrl && window.location.href.includes('index.html')) {
                sessionStorage.removeItem('redirectAfterLogin');
                window.location.href = redirectUrl;
            }
        }
    }
    
    // 当DOM加载完成时初始化
    document.addEventListener('DOMContentLoaded', init);
    
    // 公开API
    return {
        // 用户认证
        isLoggedIn,
        getCurrentUser,
        getUsername,
        logout,
        requireLogin,
        
        // 数据操作
        getUserData,
        saveUserData,
        getAllUsers,
        
        // 内部方法(仅用于测试)
        _init: init,
        _initFirebase: initFirebase,
        _handleLogin: handleLogin
    };
})();

// 页面加载完成后立即执行初始化
window.addEventListener('load', function() {
    // 如果是登录页面，绑定事件处理
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // DOM已加载，但可能在DOMContentLoaded事件之前注册的事件监听器错过了
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            window.AuthService._handleLogin(e);
        });
    }
});

