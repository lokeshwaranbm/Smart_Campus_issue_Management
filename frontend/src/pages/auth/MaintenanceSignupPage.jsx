import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/auth/AuthShell';
import AuthCard from '../../components/auth/AuthCard';
import AuthHeader from '../../components/auth/AuthHeader';
import FormField from '../../components/auth/FormField';
import PasswordField from '../../components/auth/PasswordField';
import SelectField from '../../components/auth/SelectField';
import AlertMessage from '../../components/auth/AlertMessage';
import PasswordStrength from '../../components/auth/PasswordStrength';
import { registerUser } from '../../utils/auth';
import { validateEmail, getPasswordStrength } from '../../utils/validation';
import { departments } from '../../constants/formOptions';

export default function MaintenanceSignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    employeeId: '',
    department: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setMessage('');
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) nextErrors.fullName = 'Full name is required.';
    if (!formData.email.trim()) nextErrors.email = 'Email is required.';
    else if (!validateEmail(formData.email)) nextErrors.email = 'Enter a valid email format.';
    if (!formData.employeeId.trim()) nextErrors.employeeId = 'Employee ID is required.';
    if (!formData.department) nextErrors.department = 'Department is required.';

    if (!formData.phoneNumber.trim()) nextErrors.phoneNumber = 'Phone number is required.';
    else if (!/^\d{10}$/.test(formData.phoneNumber)) nextErrors.phoneNumber = 'Enter a valid 10-digit number.';

    if (!formData.password) nextErrors.password = 'Password is required.';
    else if (passwordStrength.score < 3)
      nextErrors.password = 'Use at least 8 chars with uppercase, lowercase, and number.';

    if (!formData.confirmPassword) nextErrors.confirmPassword = 'Confirm your password.';
    else if (formData.password !== formData.confirmPassword)
      nextErrors.confirmPassword = 'Passwords do not match.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    const result = registerUser({
      fullName: formData.fullName,
      email: formData.email,
      employeeId: formData.employeeId,
      department: formData.department,
      phoneNumber: formData.phoneNumber,
      password: formData.password,
      role: 'maintenance',
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
    });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    navigate('/login', {
      state: {
        message:
          'Maintenance registration submitted. Account will be activated after admin approval.',
      },
    });
  };

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeader
          title="Maintenance Staff Registration"
          subtitle="Create a maintenance account"
        />

        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Account will be activated after admin approval.
        </p>

        <AlertMessage message={message} />

        <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
          <FormField
            id="fullName"
            label="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            error={errors.fullName}
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="staff@university.edu"
            error={errors.email}
          />

          <FormField
            id="employeeId"
            label="Employee ID"
            value={formData.employeeId}
            onChange={handleChange}
            placeholder="Ex: EMP-1024"
            error={errors.employeeId}
          />

          <SelectField
            id="department"
            label="Department"
            value={formData.department}
            onChange={handleChange}
            error={errors.department}
            options={departments}
            placeholder="Select department"
          />

          <FormField
            id="phoneNumber"
            label="Phone Number"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="10-digit phone number"
            error={errors.phoneNumber}
          />

          <PasswordField
            id="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            showPassword={showPassword}
            onToggle={() => setShowPassword((prev) => !prev)}
            placeholder="Create a strong password"
            error={errors.password}
          />

          <PasswordStrength password={formData.password} />

          <PasswordField
            id="confirmPassword"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            showPassword={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((prev) => !prev)}
            placeholder="Re-enter password"
            error={errors.confirmPassword}
          />

          <button type="submit" className="primary-button">
            Submit Registration
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Back to{' '}
          <Link to="/login" className="secondary-link">
            Login
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
