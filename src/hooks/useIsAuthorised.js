// src/hooks/useIsAuthorized.js
import { useAuth } from '../context/authcontexts';
import { AUTHORIZED_EMAILS } from '../config/authorisedUsers';

function useIsAuthorized() {
  const { user } = useAuth();
  
  const isAuthorized = Boolean(
    user?.email && AUTHORIZED_EMAILS.includes(user.email.trim().toLowerCase())
  );

  return isAuthorized;
}
export default useIsAuthorized;