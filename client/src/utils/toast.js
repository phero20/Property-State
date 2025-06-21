const toast = {
  success: (message) => {
    alert(`✅ ${message}`);
  },
  error: (message) => {
    alert(`❌ ${message}`);
  },
  warning: (message) => {
    alert(`⚠️ ${message}`);
  },
  info: (message) => {
    alert(`ℹ️ ${message}`);
  }
};

export { toast };