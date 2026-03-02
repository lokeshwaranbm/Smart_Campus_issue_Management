import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/auth/AuthShell';
import AuthCard from '../../components/auth/AuthCard';
import AuthHeader from '../../components/auth/AuthHeader';
import FormField from '../../components/auth/FormField';
import PasswordField from '../../components/auth/PasswordField';
import AlertMessage from '../../components/auth/AlertMessage';
import { loginUser, resolveRoleRedirect, setAuthSession } from '../../utils/auth';
import { validateEmail } from '../../utils/validation';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const flashMessage = useMemo(() => location.state?.message || '', [location.state]);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setMessage('');
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.email.trim()) nextErrors.email = 'Email is required.';
    else if (!validateEmail(formData.email)) nextErrors.email = 'Enter a valid email format.';

    if (!formData.password.trim()) nextErrors.password = 'Password is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    const result = loginUser(formData);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setAuthSession(result.user);
    navigate(resolveRoleRedirect(result.user.role));
  };

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeader
          title="Smart Campus Issue Management System"
          subtitle="Login to your account"
        />

        <AlertMessage type="success" message={flashMessage} />
        <AlertMessage message={message} />

        <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
          <FormField
            id="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@university.edu"
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

        <p className="mt-5 text-center text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link className="secondary-link" to="/signup/student">
            Sign Up
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-slate-600">
          Maintenance Staff?{' '}
          <Link className="secondary-link" to="/signup/maintenance">
            Register here
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
