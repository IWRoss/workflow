import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  msalInstance,
  loginRequest,
  msalReady,
} from "../microsoftAuthConfig/msalConfig";

const MicrosoftLoginButton = () => {
  const [errorMessage, setErrorMessage] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  // Handle the redirect response when the page loads back
  useEffect(() => {
    const handleRedirect = async () => {
      await msalReady;

      // This checks if we're coming back from a Microsoft login redirect
      const response = await msalInstance.handleRedirectPromise();
      if (response) {

        // Set the active account for future token requests
        msalInstance.setActiveAccount(response.account);

        // Now we need to acquire a token to call our backend
        const tokenRes = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account: response.account,
        });

        const graphAccessToken = tokenRes.accessToken;

        const res = await fetch(
          `${API_URL}/microsoftAuth/microsoft-login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: graphAccessToken }),
          }
        );

        const data = await res.json();

        if (data.success) {
          login({ ...data.user, token: data.token });
          navigate("/dashboard");
        } else {
          setErrorMessage(data.error || "Microsoft login failed.");
        }
      }
    };

    handleRedirect().catch((err) => {
      console.error(err);
      setErrorMessage("Microsoft login failed. Please try again.");
    });
  }, []);


  //Waits for msal to be ready before allowing login
  const handleMicrosoftLogin = async () => {
    await msalReady;
   
    msalInstance.loginRedirect(loginRequest);
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