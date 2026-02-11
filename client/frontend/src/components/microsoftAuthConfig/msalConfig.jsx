import { PublicClientApplication, BrowserCacheLocation } from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_TENANT_ID}`,
    redirectUri: window.location.origin, 
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage,
    temporaryCacheLocation: BrowserCacheLocation.LocalStorage,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const msalReady = msalInstance.initialize();

export const loginRequest = {
  scopes: ["User.Read"],
};
