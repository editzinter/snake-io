// Debug script to catch and display errors
(function() {
    // Create a debug element to display errors
    const debugElement = document.createElement('div');
    debugElement.id = 'debug-panel';
    debugElement.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        max-height: 200px;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        overflow-y: auto;
        z-index: 9999;
        display: none;
    `;
    
    // Create a toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Show Debug';
    toggleBtn.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        z-index: 10000;
        padding: 5px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
    `;
    
    // Add toggle functionality
    toggleBtn.addEventListener('click', function() {
        const panel = document.getElementById('debug-panel');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            toggleBtn.textContent = 'Hide Debug';
        } else {
            panel.style.display = 'none';
            toggleBtn.textContent = 'Show Debug';
        }
    });
    
    // Add elements to the DOM when it's ready
    document.addEventListener('DOMContentLoaded', function() {
        document.body.appendChild(debugElement);
        document.body.appendChild(toggleBtn);
        log('Debug panel initialized');
    });
    
    // Log function to add messages to the debug panel
    function log(message, type = 'info') {
        const panel = document.getElementById('debug-panel');
        if (panel) {
            const entry = document.createElement('div');
            entry.style.cssText = `
                margin: 2px 0;
                padding: 3px;
                border-bottom: 1px solid #333;
            `;
            
            if (type === 'error') {
                entry.style.color = '#ff6666';
            } else if (type === 'warning') {
                entry.style.color = '#ffcc00';
            } else if (type === 'success') {
                entry.style.color = '#66ff66';
            }
            
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            panel.appendChild(entry);
            panel.scrollTop = panel.scrollHeight;
        }
    }
    
    // Capture and log error events
    window.addEventListener('error', function(event) {
        const errorMsg = `ERROR: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`;
        log(errorMsg, 'error');
        
        // Keep the default error handling
        return false;
    });
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        const errorMsg = `UNHANDLED PROMISE: ${event.reason}`;
        log(errorMsg, 'error');
    });
    
    // Override console methods to also log to our panel
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info
    };
    
    console.log = function() {
        const args = Array.from(arguments).join(' ');
        log(args, 'info');
        originalConsole.log.apply(console, arguments);
    };
    
    console.warn = function() {
        const args = Array.from(arguments).join(' ');
        log(args, 'warning');
        originalConsole.warn.apply(console, arguments);
    };
    
    console.error = function() {
        const args = Array.from(arguments).join(' ');
        log(args, 'error');
        originalConsole.error.apply(console, arguments);
    };
    
    console.info = function() {
        const args = Array.from(arguments).join(' ');
        log(args, 'info');
        originalConsole.info.apply(console, arguments);
    };
    
    // Expose debug functionality globally
    window.debugPanel = {
        log: log,
        clear: function() {
            const panel = document.getElementById('debug-panel');
            if (panel) {
                panel.innerHTML = '';
                log('Debug panel cleared');
            }
        },
        show: function() {
            const panel = document.getElementById('debug-panel');
            if (panel) {
                panel.style.display = 'block';
                toggleBtn.textContent = 'Hide Debug';
            }
        },
        hide: function() {
            const panel = document.getElementById('debug-panel');
            if (panel) {
                panel.style.display = 'none';
                toggleBtn.textContent = 'Show Debug';
            }
        }
    };
})();

// Global error handling
window.addEventListener('error', (e) => {
  console.error("Global Error:", e.message, e.error);
  console.error("Error Stack:", e.error && e.error.stack);
  
  // Try to extract minified variable info
  if (e.message && e.message.includes("t is undefined")) {
    console.error("Context where 't' is undefined:", e);
    const stack = e.error && e.error.stack;
    if (stack) {
      const lines = stack.split('\n');
      console.error("Relevant stack trace:");
      lines.forEach(line => {
        if (line.includes('.js:')) {
          console.error(line.trim());
        }
      });
    }
  }
});

// Override console.error to make errors more visible
const originalError = console.error;
console.error = function() {
  originalError.apply(console, arguments);
  
  // Create a more visible error in the console
  if (arguments[0] && typeof arguments[0] === 'string') {
    const errorMsg = Array.from(arguments).join(' ');
    if (errorMsg.includes('undefined') || errorMsg.includes('null')) {
      originalError.call(console, '%c CRITICAL ERROR: Undefined or null reference ', 
        'background: #e74c3c; color: white; padding: 2px 4px; border-radius: 2px; font-weight: bold;', 
        errorMsg);
    }
  }
};

// Log environment info
console.log('Debug script loaded');
console.log('Browser:', navigator.userAgent);
console.log('Secure context:', window.isSecureContext);
console.log('Hostname:', window.location.hostname);
console.log('Origin:', window.location.origin); 