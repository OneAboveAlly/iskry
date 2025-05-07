// Authentication utility functions

// Store the authentication token and user data
export const storeAuthData = (token: string, userData: any) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
};

// Retrieve the authentication token
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Retrieve the authenticated user data
export const getAuthUser = (): any => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Clear authentication data (logout)
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Check if the user is an admin
export const isAdmin = (): boolean => {
  const user = getAuthUser();
  return user && user.isAdmin === true;
};

// Add Bearer prefix to token for Authorization header
export const getAuthHeader = (): { Authorization: string } | {} => {
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

// Create a fetch wrapper with auth headers
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  return fetch(url, {
    ...options,
    headers
  });
}; 