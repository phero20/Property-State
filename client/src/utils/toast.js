import { toast as reactToast } from 'react-toastify';

const toast = {
  success: (message) => {
    reactToast.success(message);
  },
  error: (message) => {
    reactToast.error(message);
  },
  warning: (message) => {
    reactToast.warn(message);
  },
  info: (message) => {
    reactToast.info(message);
  }
};

export { toast };