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
    function log(message, type) {
        if (type === undefined) type = 'info';
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
window.addEventListener('error', function(e) {
  console.error("Global Error:", e.message, e.error);
  if (e.error && e.error.stack) {
    console.error("Error Stack:", e.error.stack);
  }
  
  // Try to extract minified variable info
  if (e.message && e.message.includes("t is undefined")) {
    console.error("Context where 't' is undefined:", e);
    if (e.error && e.error.stack) {
      const stack = e.error.stack;
      const lines = stack.split('\n');
      console.error("Relevant stack trace:");
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].includes('.js:')) {
          console.error(lines[i].trim());
        }
      }
    }
  }
});

// Override console.error to make errors more visible
const originalErrorFn = console.error;
console.error = function() {
  originalErrorFn.apply(console, arguments);
  
  // Create a more visible error in the console
  if (arguments[0] && typeof arguments[0] === 'string') {
    const errorMsg = Array.from(arguments).join(' ');
    if (errorMsg.includes('undefined') || errorMsg.includes('null')) {
      originalErrorFn.call(console, '%c CRITICAL ERROR: Undefined or null reference ', 
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

// Enhanced debug script for capturing errors and logging
console.log('%c Debug Mode Active', 'background: #222; color: #bada55; padding: 5px; border-radius: 5px;');

// Comprehensive error tracking - using a traditional function to avoid arrow functions
window.addEventListener('error', function(event) {
  const errorDetails = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error ? event.error.toString() : undefined,
    stack: event.error && event.error.stack ? event.error.stack : undefined
  };
  
  console.error('%c Detailed Error Capture:', 'background: #f44336; color: white; padding: 3px; border-radius: 3px;', 
    JSON.stringify(errorDetails, null, 2));
  
  // Specific handling for minified variable errors
  if (event.message.includes('is undefined') || event.message.includes('cannot read property')) {
    console.error('%c Potential Minification Error Detected', 'background: #f57c00; color: white; padding: 3px; border-radius: 3px;');
    console.error('Possible Causes:', [
      'Incorrect module loading',
      'Webpack/Parcel bundling issue',
      'Dependency version mismatch',
      'Script execution order problem'
    ]);
    
    // Log browser environment info to help debugging
    console.info('Environment Info:', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      windowSize: window.innerWidth + 'x' + window.innerHeight
    });
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
  var reasonText = (event.reason && typeof event.reason.toString === 'function') ? 
    event.reason.toString() : 
    String(event.reason);
  var stackText = (event.reason && event.reason.stack) ? 
    event.reason.stack : 
    'No stack trace available';
    
  console.error('%c Unhandled Promise Rejection:', 'background: #d32f2f; color: white; padding: 3px; border-radius: 3px;', 
    reasonText, stackText);
});

// Track script loading - using traditional function
var trackScriptLoading = function() {
  var scripts = document.querySelectorAll('script');
  for (var i = 0; i < scripts.length; i++) {
    var script = scripts[i];
    var src = script.src || 'inline';
    script.addEventListener('load', function() {
      console.log('Script loaded: ' + src);
    });
    script.addEventListener('error', function(e) {
      console.error('Script failed to load: ' + src, e);
    });
  }
};

// Run script tracking after DOM content is loaded
document.addEventListener('DOMContentLoaded', trackScriptLoading);

// Store original console methods to enhance them
var consoleBackup = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

// Add timestamps to console methods - using traditional function
var addTimestamps = function() {
  var getTimestamp = function() {
    var now = new Date();
    return '[' + now.toISOString() + ']';
  };

  console.log = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(getTimestamp());
    consoleBackup.log.apply(console, args);
  };

  console.error = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(getTimestamp());
    consoleBackup.error.apply(console, args);
  };

  console.warn = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(getTimestamp());
    consoleBackup.warn.apply(console, args);
  };

  console.info = function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(getTimestamp());
    consoleBackup.info.apply(console, args);
  };
};

// Apply console enhancements
addTimestamps();

// Expose a global debug helper for direct use in other modules
window.debugHelper = {
  logError: function(source, error) {
    var errorString = error ? error.toString() : 'Unknown error';
    var stackTrace = error && error.stack ? error.stack : 'No stack trace';
    
    console.error('%c Error in ' + source + ':', 'background: #d50000; color: white; padding: 2px; border-radius: 2px;', 
      errorString, stackTrace);
  },
  logInfo: function(source, message) {
    console.info('%c ' + source + ':', 'background: #2196f3; color: white; padding: 2px; border-radius: 2px;', message);
  },
  trackFunction: function(funcName, func) {
    return function() {
      var args = Array.prototype.slice.call(arguments);
      console.log('Calling ' + funcName + ' with:', args);
      try {
        var result = func.apply(this, args);
        if (result && typeof result.then === 'function') {
          return result.catch(function(err) {
            console.error('Error in async ' + funcName + ':', err);
            throw err;
          });
        }
        return result;
      } catch (err) {
        console.error('Error in ' + funcName + ':', err);
        throw err;
      }
    };
  }
};

console.log('Debug utilities initialized'); 