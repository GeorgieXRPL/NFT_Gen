/**
 * Resource Monitor
 * 
 * Monitors application memory usage and periodically prompts users to save their project
 * to prevent data loss from memory-related crashes.
 */

console.log("Initializing Resource Monitor...");

// Create global ResourceMonitor namespace
window.ResourceMonitor = (function() {
  // Configuration
  const config = {
    memoryCheckInterval: 60000, // Check memory every 60 seconds (1 minute)
    savePromptInterval: 60000, // Prompt to save every 60 seconds (1 minute)
    memoryWarningThreshold: 0.70, // Warn at 70% of memory (if available)
    memoryCriticalThreshold: 0.85, // Critical warning at 85% of memory
    memoryNotificationThreshold: 0.50, // Show save reminder notification at 50% of memory
    maxPromptsPerHour: 60 // Limit prompts to avoid spam (1 per minute max)
  };
  
  // State tracking
  const state = {
    lastMemoryCheckTime: 0,
    lastSavePromptTime: 0,
    promptCount: 0,
    promptResetTime: Date.now(),
    monitoringActive: false,
    savePromptActive: false
  };
  
  // Initialize monitoring
  function init() {
    console.log("Resource Monitor initialized");
    
    // Start periodic monitoring
    startMonitoring();
    
    // Also monitor after key operations (save, import, etc.)
    setupEventListeners();
  }
  
  // Start periodic monitoring
  function startMonitoring() {
    if (state.monitoringActive) return;
    state.monitoringActive = true;
    
    // Check memory immediately
    checkMemoryUsage();
    
    // Then check memory periodically
    setInterval(() => {
      checkMemoryUsage();
    }, config.memoryCheckInterval);
    
    // Start periodic save prompts (every minute)
    startPeriodicSavePrompts();
    
    console.log("Resource monitoring started");
  }
  
  // Start periodic save prompts
  function startPeriodicSavePrompts() {
    // Wait 1 minute before first prompt
    setTimeout(() => {
      promptUserToSave();
      // Then prompt every minute
      setInterval(() => {
        promptUserToSave();
      }, config.savePromptInterval);
    }, config.savePromptInterval);
    
    console.log("Periodic save prompts started (every 1 minute)");
  }
  
  // Setup event listeners for immediate checks after critical operations
  function setupEventListeners() {
    // Reset save prompt timer after saving project data
    document.addEventListener('project:saved', () => {
      state.lastSavePromptTime = Date.now();
      console.log('[ResourceMonitor] Save prompt timer reset after project save');
    });
  }
  
  // Prompt user to save project periodically
  function promptUserToSave() {
    // Check rate limiting
    const now = Date.now();
    
    // Reset counter every hour
    if (now - state.promptResetTime > 3600000) {
      state.promptCount = 0;
      state.promptResetTime = now;
    }
    
    // Don't show if we've exceeded the limit
    if (state.promptCount >= config.maxPromptsPerHour) {
      return;
    }
    
    // Don't show if a prompt is already active
    if (state.savePromptActive) {
      return;
    }
    
    // Check if user just saved (within last 30 seconds) - skip this prompt
    if (now - state.lastSavePromptTime < 30000) {
      console.log('[ResourceMonitor] Skipping save prompt - project was recently saved');
      return;
    }
    
    state.promptCount++;
    
    try {
      // Check memory usage first
      const memoryCheck = checkMemoryUsage();
      
      // CRITICAL: Only show notification if memory usage is 50% or more
      if (!memoryCheck || memoryCheck.usagePercent < config.memoryNotificationThreshold) {
        console.log('[ResourceMonitor] Memory usage below 50%, skipping save reminder');
        return;
      }
      
      // If critical memory usage detected, show critical warning instead of regular prompt
      if (memoryCheck && memoryCheck.level === 'critical') {
        showCriticalMemoryWarning(memoryCheck);
        return;
      }
      
      // Show non-blocking notification in top right corner
      showSaveReminderNotification(memoryCheck);
      
    } catch (error) {
      console.error('[ResourceMonitor] Error showing save prompt:', error);
    }
  }
  
  // Show non-blocking save reminder notification in top right corner
  function showSaveReminderNotification(memoryCheck) {
    // Remove any existing notification
    const existingNotification = document.getElementById('save-reminder-notification');
    if (existingNotification) {
      existingNotification.remove();
    }
    
    const usagePercent = Math.round(memoryCheck.usagePercent * 100);
    const usedMB = parseFloat(memoryCheck.usedMB);
    const totalMB = parseFloat(memoryCheck.totalMB);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'save-reminder-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10001;
      background: rgba(42, 42, 62, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
      min-width: 320px;
      max-width: 400px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      font-family: 'Archivo', sans-serif;
      color: #ecf0f1;
      animation: slideInRight 0.3s ease;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="flex: 1;">
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #ecf0f1;">
            💾 Save Your Project?
          </div>
          <div style="font-size: 12px; color: #bdc3c7; margin-bottom: 12px; line-height: 1.5;">
            Memory usage is at <strong style="color: ${usagePercent >= 70 ? '#f39c12' : '#3498db'}">${usagePercent}%</strong> (${usedMB.toFixed(0)}MB / ${totalMB.toFixed(0)}MB). 
            Saving regularly helps prevent data loss.
          </div>
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button id="save-reminder-save-btn" style="
              flex: 1;
              background: #27ae60;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 13px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
              font-family: 'Archivo', sans-serif;
            ">Save</button>
            <button id="save-reminder-dismiss-btn" style="
              flex: 1;
              background: transparent;
              color: #95a5a6;
              border: 1px solid rgba(255, 255, 255, 0.2);
              padding: 8px 16px;
              border-radius: 6px;
              font-size: 13px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
              font-family: 'Archivo', sans-serif;
            ">Dismiss</button>
          </div>
        </div>
        <button id="save-reminder-close-btn" style="
          background: transparent;
          border: none;
          color: #7f8c8d;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          line-height: 1;
        ">&times;</button>
      </div>
    `;
    
    // Add animation keyframes if not already present
    if (!document.getElementById('save-reminder-styles')) {
      const style = document.createElement('style');
      style.id = 'save-reminder-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        #save-reminder-save-btn:hover {
          background: #229954 !important;
          transform: scale(1.02);
        }
        #save-reminder-dismiss-btn:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: #ecf0f1 !important;
        }
        #save-reminder-close-btn:hover {
          color: #ecf0f1 !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 10 seconds
    const autoDismiss = setTimeout(() => {
      dismissNotification();
    }, 10000);
    
    // Save button handler
    const saveBtn = notification.querySelector('#save-reminder-save-btn');
    saveBtn.addEventListener('click', () => {
      clearTimeout(autoDismiss);
      state.savePromptActive = true;
      dismissNotification();
      try {
        if (window.NFTApp && window.NFTApp.getModule('projectService')) {
          const projectService = window.NFTApp.getModule('projectService');
          if (typeof projectService.save === 'function') {
            projectService.save(false);
            console.log('[ResourceMonitor] Save reminder: User clicked Save');
            state.lastSavePromptTime = Date.now();
            
            // Show success notification
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
              window.NFTApp.getModule("notificationService").show("Project saved successfully", "success", 2000);
            }
          }
        }
      } catch (saveError) {
        console.error('[ResourceMonitor] Failed to save:', saveError);
      } finally {
        state.savePromptActive = false;
      }
    });
    
    // Dismiss button handler
    const dismissBtn = notification.querySelector('#save-reminder-dismiss-btn');
    dismissBtn.addEventListener('click', () => {
      clearTimeout(autoDismiss);
      dismissNotification();
    });
    
    // Close button handler
    const closeBtn = notification.querySelector('#save-reminder-close-btn');
    closeBtn.addEventListener('click', () => {
      clearTimeout(autoDismiss);
      dismissNotification();
    });
    
    function dismissNotification() {
      if (notification.parentNode) {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }
  }
  
  // Check memory usage (if available) and show warnings if needed
  function checkMemoryUsage() {
    try {
      // Chrome/Edge only - performance.memory is not standard but available in Chrome
      if (performance.memory) {
        const usedMB = performance.memory.usedJSHeapSize / 1024 / 1024;
        const totalMB = performance.memory.totalJSHeapSize / 1024 / 1024;
        const limitMB = performance.memory.jsHeapSizeLimit / 1024 / 1024;
        
        const usagePercent = usedMB / limitMB;
        
        state.lastMemoryCheckTime = Date.now();
        
        if (usagePercent >= config.memoryCriticalThreshold) {
          // Critical memory usage - show immediate warning (bypass periodic prompt)
          return {
            type: 'memory',
            level: 'critical',
            message: `⚠️ CRITICAL: Memory usage is very high`,
            details: `Memory usage is at ${(usagePercent * 100).toFixed(1)}% (${usedMB.toFixed(0)}MB / ${limitMB.toFixed(0)}MB). Please save your project immediately to prevent crashes!`,
            usagePercent: usagePercent,
            usedMB: usedMB.toFixed(0),
            totalMB: limitMB.toFixed(0)
          };
        } else if (usagePercent >= config.memoryWarningThreshold) {
          // High memory usage - return warning info for periodic prompt
          return {
            type: 'memory',
            level: 'warning',
            message: `⚠️ WARNING: Memory usage is high`,
            details: `Memory usage is at ${(usagePercent * 100).toFixed(1)}% (${usedMB.toFixed(0)}MB / ${limitMB.toFixed(0)}MB). Consider saving your project to free up memory.`,
            usagePercent: usagePercent,
            usedMB: usedMB.toFixed(0),
            totalMB: limitMB.toFixed(0)
          };
        } else if (usagePercent >= config.memoryNotificationThreshold) {
          // Memory usage at 50% or more - return info for save reminder notification
          return {
            type: 'memory',
            level: 'normal',
            message: `Save Your Project?`,
            details: `Memory usage is at ${(usagePercent * 100).toFixed(1)}% (${usedMB.toFixed(0)}MB / ${limitMB.toFixed(0)}MB). Saving regularly helps prevent data loss.`,
            usagePercent: usagePercent,
            usedMB: usedMB.toFixed(0),
            totalMB: limitMB.toFixed(0)
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('[ResourceMonitor] Error checking memory:', error);
      return null;
    }
  }
  
  // Show critical memory warning immediately (not part of periodic prompts)
  function showCriticalMemoryWarning(memoryCheck) {
    try {
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("confirmationModal")) {
        window.NFTApp.getModule("confirmationModal").show(
          memoryCheck.message,
          memoryCheck.details,
          "⚠️ CRITICAL: Click 'Save' to save your project immediately to prevent crashes!",
          () => {
            // User clicked Save
            try {
              if (window.NFTApp && window.NFTApp.getModule('projectService')) {
                const projectService = window.NFTApp.getModule('projectService');
                if (typeof projectService.save === 'function') {
                  projectService.save(false);
                  console.log('[ResourceMonitor] Critical memory save initiated');
                  state.lastSavePromptTime = Date.now();
                }
              }
            } catch (saveError) {
              console.error('[ResourceMonitor] Failed to save:', saveError);
            }
          }
        );
      } else {
        const userResponse = confirm(
          memoryCheck.message + "\n\n" + memoryCheck.details + "\n\n" +
          "⚠️ CRITICAL: Click OK to save your project immediately!"
        );
        
        if (userResponse) {
          try {
            if (window.NFTApp && window.NFTApp.getModule('projectService')) {
              const projectService = window.NFTApp.getModule('projectService');
              if (typeof projectService.save === 'function') {
                projectService.save(false);
                console.log('[ResourceMonitor] Critical memory save initiated');
                state.lastSavePromptTime = Date.now();
              }
            }
          } catch (saveError) {
            console.error('[ResourceMonitor] Failed to save:', saveError);
          }
        }
      }
    } catch (error) {
      console.error('[ResourceMonitor] Error showing critical memory warning:', error);
      alert(memoryCheck.message + "\n\nPlease save your project immediately!");
    }
  }
  
  // Force immediate memory check (for manual triggers)
  function checkNow() {
    const memoryCheck = checkMemoryUsage();
    if (memoryCheck && memoryCheck.level === 'critical') {
      showCriticalMemoryWarning(memoryCheck);
    }
  }
  
  // Get current memory usage statistics
  function getResourceStats() {
    return {
      memory: checkMemoryUsage()
    };
  }
  
  // Initialize the resource monitor
  init();
  
  // Public API
  return {
    checkNow,
    getResourceStats,
    startMonitoring,
    config // Expose config for customization
  };
})();

console.log("Resource Monitor loaded successfully");

