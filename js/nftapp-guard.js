// NFTApp Guard - logs any assignment or deletion of window.NFTApp or its methods
(function() {
  let _NFTApp = window.NFTApp;
  Object.defineProperty(window, 'NFTApp', {
    configurable: true,
    enumerable: true,
    get() {
      return _NFTApp;
    },
    set(val) {
      // Silenced: console.warn('[NFTApp GUARD] window.NFTApp was overwritten!', val);
      _NFTApp = val;
    }
  });

  function guardMethod(obj, methodName) {
    let _method = obj[methodName];
    Object.defineProperty(obj, methodName, {
      configurable: true,
      enumerable: true,
      get() {
        return _method;
      },
      set(val) {
        // Silenced: console.warn(`[NFTApp GUARD] window.NFTApp.${methodName} was overwritten!`, val);
        _method = val;
      }
    });
  }

  window.addEventListener('DOMContentLoaded', function() {
    if (window.NFTApp) {
      ['registerModule', 'getModule', 'initModules'].forEach(function(method) {
        if (window.NFTApp.hasOwnProperty(method)) {
          guardMethod(window.NFTApp, method);
        }
      });
    }

    // Periodic debug log to catch late overwrites (silenced for cleaner console)
    // let count = 0;
    // const interval = setInterval(() => {
    //   count++;
    //   console.log(`[NFTApp GUARD] Periodic check #${count}: typeof window.NFTApp.registerModule =`, typeof window.NFTApp && window.NFTApp.registerModule, window.NFTApp && window.NFTApp.registerModule);
    //   if (count >= 10) clearInterval(interval);
    // }, 500);
  });
})(); 