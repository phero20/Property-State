import React from 'react';
import { useApiStatus } from '../context/ApiStatusContext';

const ReconnectButton = () => {
  const { checkServerStatus, isServerOnline } = useApiStatus();
  const [isChecking, setIsChecking] = useState(false);
  
  const handleReconnect = async () => {
    setIsChecking(true);
    await checkServerStatus();
    setIsChecking(false);
  };
  
  return (
    <button
      onClick={handleReconnect}
      disabled={isChecking || isServerOnline}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
        ${isServerOnline 
          ? 'bg-green-100 text-green-800 cursor-default'
          : isChecking 
            ? 'bg-blue-100 text-blue-800 cursor-wait' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
    >
      {isServerOnline 
        ? '✅ Connected' 
        : isChecking 
          ? '⏳ Checking...' 
          : '🔄 Reconnect to API'}
    </button>
  );
};

export default ReconnectButton;