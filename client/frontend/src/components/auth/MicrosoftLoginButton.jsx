
import {
    msalInstance,
    loginRequest,
    msalReady,
} from "../microsoftAuthConfig/msalConfig";


const MicrosoftLoginButton = ({ errorMessage, onClearError }) => {
  const handleMicrosoftLogin = async () => {
    await msalReady;
    if (onClearError) onClearError();

    msalInstance.clearCache();

    msalInstance.loginRedirect({
      ...loginRequest,
      prompt: "select_account",
    });
  };

  return (
    <>
      {errorMessage && (
        <div className="mb-4 p-3 text-center bg-red-100 text-red-700 border border-red-400 rounded">
          {errorMessage}
        </div>
      )}
      <button
        onClick={handleMicrosoftLogin}
        className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 hover:bg-gray-50"
      >
        <svg width="20" height="20" viewBox="0 0 21 21">
          <rect x="1" y="1" width="9" height="9" fill="#f25022" />
          <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
          <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
          <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
        </svg>
        Sign in with Microsoft
      </button>
    </>
  );
};

export default MicrosoftLoginButton;