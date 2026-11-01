import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { ENDPOINTS } from '../Constants/config';
import { getJson, postJson } from '../redux/slices/authSlice';

// Loads the logged-in account's full profile, picking the endpoint by role:
//   admin      → public_app/admin_details       (admins self-registered)
//   technician → public_app/technician_details  (added by an admin)
// Both are fetched by user_id. A technician (staff) login has no account of its own
// in those tables (its id is a staff id), so nothing is fetched for it and the login
// data is used as is. Returns the logged-in user with the fetched
// fields laid over it. Empty values from the server never replace what login
// already gave us (the details endpoints can return only a few fields).
const NO_USER = {};

export default function useAccountProfile() {
  const user = useSelector(state => state.auth.user) || NO_USER;
  const isAdmin = user.role === 'admin';
  // Staff logins skip the lookup: their id would match some other account.
  const lookupId = user.tech_id ? null : user.user_id;
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    setProfile(null);
    (async () => {
      if (!lookupId) return;
      try {
        const endpoint = isAdmin ? ENDPOINTS.ADMIN_DETAILS : ENDPOINTS.TECHNICIAN_DETAILS;
        const { response, data } = await postJson(endpoint, { user_id: lookupId });
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
  }, [lookupId, isAdmin]);

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

// The record shown on the Digital ID. For a normal account that is its own profile.
// For a technician (staff) login it is the member who added them (their admin): the
// member's record is picked out of public_app/getallmembers by member_id.
export function useMemberProfile() {
  const user = useSelector(state => state.auth.user) || NO_USER;
  const account = useAccountProfile();
  const [member, setMember] = useState(null);
  const isStaff = !!user.tech_id;

  useEffect(() => {
    if (!isStaff || !user.member_id) return undefined;
    let active = true;
    (async () => {
      try {
        const { response, data } = await getJson(ENDPOINTS.GET_ALL_MEMBERS);
        const rows = Array.isArray(data) ? data : data && data.data;
        if (!active || !response.ok || !Array.isArray(rows)) return;
        const row = rows.find(r => r && String(r.id) === String(user.member_id));
        if (row) setMember({ ...row, member_id: user.member_id });
      } catch (e) {
        // leave the card empty if the lookup fails
      }
    })();
    return () => {
      active = false;
    };
  }, [isStaff, user.member_id]);

  return isStaff ? member || {} : account;
}
