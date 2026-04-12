import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/auth/AuthShell';
import AuthCard from '../../components/auth/AuthCard';
import AuthHeader from '../../components/auth/AuthHeader';
import FormField from '../../components/auth/FormField';
import PasswordField from '../../components/auth/PasswordField';
import AlertMessage from '../../components/auth/AlertMessage';
import { clearAuthSession, loginUser, resolveRoleRedirect, setAuthSession } from '../../utils/auth';
import { validateEmail } from '../../utils/validation';
import useCampusInfo from '../../hooks/useCampusInfo';
import { 
  checkLoginAttempt, 
  recordFailedLogin, 
  clearLoginAttempts 
} from '../../utils/loginAttempts';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const flashMessage = useMemo(() => location.state?.message || '', [location.state]);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const { universityName, emailDomain } = useCampusInfo();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setMessage('');
    setMessageType('error');
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.email.trim()) nextErrors.email = 'Email is required.';
    else if (!validateEmail(formData.email)) nextErrors.email = 'Enter a valid email format.';

    if (!formData.password.trim()) nextErrors.password = 'Password is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    // Always reset previous session before starting a new login flow.
    clearAuthSession();

    // Check if login attempt is allowed (account not locked)
    const attemptCheck = checkLoginAttempt(formData.email);
    if (!attemptCheck.allowed) {
      setMessage(attemptCheck.message);
      setMessageType('error');
      return;
    }

    const result = await loginUser(formData);
    if (!result.ok) {
      // Record failed login attempt
      recordFailedLogin(formData.email);
      
      // Show attempts remaining if not pending approval
      if (!result.pendingApproval && attemptCheck.attemptsRemaining) {
        const remaining = attemptCheck.attemptsRemaining - 1;
        if (remaining > 0) {
          setMessage(`${result.message} (${remaining} attempt${remaining > 1 ? 's' : ''} remaining before account lock)`);
        } else {
          setMessage(`${result.message} (Warning: This is your last attempt before account lock)`);
        }
      } else {
        setMessage(result.message);
      }
      setMessageType('error');
      return;
    }

    // Clear login attempts on successful login
    clearLoginAttempts(formData.email);

    setAuthSession(result.user);
    navigate(result.redirectTo || resolveRoleRedirect(result.user.role));
  };

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeader
          title={`${universityName} Issue Management System`}
          subtitle="Login to your account"
        />

        <AlertMessage type="success" message={flashMessage} />
        <AlertMessage type={messageType} message={message} />

        <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
          <FormField
            id="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder={`name@${emailDomain}`}
            error={errors.email}
          />

          <PasswordField
            id="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            showPassword={showPassword}
            onToggle={() => setShowPassword((prev) => !prev)}
            placeholder="Enter your password"
            error={errors.password}
          />

          <button type="submit" className="primary-button">
            Login
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link className="secondary-link" to="/signup/student">
            Sign Up
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Maintenance Staff?{' '}
          <Link className="secondary-link" to="/signup/maintenance">
            Register here
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
