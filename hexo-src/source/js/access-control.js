(function() {
  'use strict';

  const AccessControl = {
    config: null,
    storageKey: 'blog_access_tokens',
    sessionTimeout: 3600000,

    init: function() {
      this.loadConfig();
      this.setupEventListeners();
      this.checkCurrentPageAccess();
    },

    loadConfig: function() {
      const configScript = document.getElementById('access-control-config');
      if (configScript) {
        try {
          this.config = JSON.parse(configScript.textContent);
        } catch (e) {
          console.error('Failed to parse access control config:', e);
          this.config = { enable: false };
        }
      }
    },

    setupEventListeners: function() {
      document.addEventListener('click', this.handleClick.bind(this));
    },

    handleClick: function(e) {
      const target = e.target.closest('a[href]');
      if (!target) return;

      const href = target.getAttribute('href');
      const category = this.extractCategoryFromUrl(href);
      
      if (category && this.isCategoryProtected(category)) {
        if (!this.hasCategoryAccess(category)) {
          e.preventDefault();
          this.promptForAccess(category, href);
        }
      }
    },

    extractCategoryFromUrl: function(url) {
      if (!url) return null;
      const match = url.match(/\/categories\/([^\/]+)/);
      return match ? decodeURIComponent(match[1]) : null;
    },

    isCategoryProtected: function(category) {
      if (!this.config || !this.config.enable) return false;
      
      const categoryConfig = this.config.categories && this.config.categories[category];
      if (categoryConfig) {
        return !categoryConfig.public;
      }
      
      return this.config.protected_categories && 
             this.config.protected_categories.hasOwnProperty(category);
    },

    hasCategoryAccess: function(category) {
      const tokens = this.getStoredTokens();
      const token = tokens[category];
      
      if (!token) return false;
      
      if (Date.now() - token.timestamp > this.sessionTimeout) {
        this.clearCategoryToken(category);
        return false;
      }
      
      return true;
    },

    getStoredTokens: function() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : {};
      } catch (e) {
        return {};
      }
    },

    storeToken: function(category, token) {
      const tokens = this.getStoredTokens();
      tokens[category] = {
        token: token,
        timestamp: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(tokens));
    },

    clearCategoryToken: function(category) {
      const tokens = this.getStoredTokens();
      delete tokens[category];
      localStorage.setItem(this.storageKey, JSON.stringify(tokens));
    },

    promptForAccess: function(category, redirectUrl) {
      const modal = this.createPasswordModal(category, redirectUrl);
      document.body.appendChild(modal);
      modal.querySelector('input').focus();
    },

    createPasswordModal: function(category, redirectUrl) {
      const self = this;
      const overlay = document.createElement('div');
      overlay.className = 'access-control-overlay';
      overlay.innerHTML = `
        <div class="access-control-modal">
          <div class="access-control-header">
            <h3>访问受限</h3>
            <button class="access-control-close">&times;</button>
          </div>
          <div class="access-control-body">
            <p class="access-control-message">分类 "${category}" 需要密码访问</p>
            <div class="access-control-input-group">
              <input type="password" class="access-control-password" 
                     placeholder="请输入访问密码" />
              <button class="access-control-submit">确认</button>
            </div>
            <p class="access-control-error" style="display: none; color: #e74c3c;"></p>
          </div>
        </div>
      `;

      const closeBtn = overlay.querySelector('.access-control-close');
      const submitBtn = overlay.querySelector('.access-control-submit');
      const passwordInput = overlay.querySelector('.access-control-password');
      const errorEl = overlay.querySelector('.access-control-error');

      const closeModal = function() {
        overlay.remove();
      };

      const submitPassword = function() {
        const password = passwordInput.value;
        if (self.verifyPassword(category, password)) {
          self.storeToken(category, btoa(password));
          closeModal();
          if (redirectUrl) {
            window.location.href = redirectUrl;
          }
        } else {
          errorEl.textContent = '密码错误，请重试';
          errorEl.style.display = 'block';
          passwordInput.value = '';
          passwordInput.focus();
        }
      };

      closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeModal();
      });
      submitBtn.addEventListener('click', submitPassword);
      passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') submitPassword();
      });

      return overlay;
    },

    verifyPassword: function(category, password) {
      if (!this.config) return false;
      
      const protectedCat = this.config.protected_categories && 
                          this.config.protected_categories[category];
      
      if (protectedCat && protectedCat.password_hash) {
        return btoa(password) === protectedCat.password_hash;
      }
      
      if (protectedCat && protectedCat.password) {
        return password === protectedCat.password;
      }
      
      return false;
    },

    checkCurrentPageAccess: function() {
      const currentPath = window.location.pathname;
      const category = this.extractCategoryFromUrl(currentPath);
      
      if (category && this.isCategoryProtected(category)) {
        if (!this.hasCategoryAccess(category)) {
          this.showAccessDeniedOverlay(category);
        }
      }
    },

    showAccessDeniedOverlay: function(category) {
      const overlay = document.createElement('div');
      overlay.className = 'access-control-overlay access-denied';
      overlay.innerHTML = `
        <div class="access-control-modal">
          <div class="access-control-header">
            <h3>访问受限</h3>
          </div>
          <div class="access-control-body">
            <p class="access-control-message">此内容需要授权访问</p>
            <p class="access-control-description">分类 "${category}" 受密码保护</p>
            <div class="access-control-input-group">
              <input type="password" class="access-control-password" 
                     placeholder="请输入访问密码" />
              <button class="access-control-submit">确认</button>
            </div>
            <p class="access-control-error" style="display: none; color: #e74c3c;"></p>
            <a href="/" class="access-control-back">返回首页</a>
          </div>
        </div>
      `;

      const submitBtn = overlay.querySelector('.access-control-submit');
      const passwordInput = overlay.querySelector('.access-control-password');
      const errorEl = overlay.querySelector('.access-control-error');
      const self = this;

      const submitPassword = function() {
        const password = passwordInput.value;
        if (self.verifyPassword(category, password)) {
          self.storeToken(category, btoa(password));
          window.location.reload();
        } else {
          errorEl.textContent = '密码错误，请重试';
          errorEl.style.display = 'block';
          passwordInput.value = '';
          passwordInput.focus();
        }
      };

      submitBtn.addEventListener('click', submitPassword);
      passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') submitPassword();
      });

      document.body.innerHTML = '';
      document.body.appendChild(overlay);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      AccessControl.init();
    });
  } else {
    AccessControl.init();
  }

  window.AccessControl = AccessControl;
})();
