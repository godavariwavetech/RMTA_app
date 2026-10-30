import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { ENDPOINTS } from '../Constants/config';
import { postJson } from '../redux/slices/authSlice';

// Loads the logged-in account's full profile, picking the endpoint by role:
//   admin      → public_app/admin_details       (admins self-registered)
//   technician → public_app/technician_details  (added by an admin)
// Both are fetched by user_id. Returns the logged-in user with the fetched
// fields laid over it. Empty values from the server never replace what login
// already gave us (the details endpoints can return only a few fields).
const NO_USER = {};

export default function useAccountProfile() {
  const user = useSelector(state => state.auth.user) || NO_USER;
  const isAdmin = user.role === 'admin';
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    setProfile(null);
    (async () => {
      if (!user.user_id) return;
      try {
        const endpoint = isAdmin ? ENDPOINTS.ADMIN_DETAILS : ENDPOINTS.TECHNICIAN_DETAILS;
        const { response, data } = await postJson(endpoint, { user_id: user.user_id });
        if (active && response.ok && data && data.success !== false) {
          // The backend sometimes wraps the record in a one-element array.
          setProfile(Array.isArray(data.data) ? data.data[0] : data.data);
        }
      } catch (e) {
        // keep the cached login details
      }
    })();
    return () => {
      active = false;
    };
  }, [user.user_id, isAdmin]);

  return useMemo(
    () => ({
      ...user,
      ...Object.fromEntries(
        Object.entries(profile || {}).filter(
          ([, v]) => v !== null && v !== undefined && v !== '',
        ),
      ),
    }),
    [user, profile],
  );
}
