import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function OnboardingBanner() {
  const { user } = useAuth();
  if (!user) return null;
  const missing = [];
  if (!user.who_i_am && !user.who_i_want_to_be && !user.what_im_looking_for) missing.push('story');
  // We can't check photos here without a separate fetch - the banner just encourages profile completion
  const isIncomplete = !user.who_i_am || !user.who_i_want_to_be || !user.what_im_looking_for;
  if (!isIncomplete) return null;
  return (
    <div className="onboarding-banner">
      <span>Your profile isn't complete yet — people want to read your story.</span>
      <Link to="/me" className="btn ghost small">Finish profile</Link>
    </div>
  );
}
