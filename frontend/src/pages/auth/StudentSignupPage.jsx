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
import { departments, semesterOptions } from '../../constants/formOptions';

export default function StudentSignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    registerNumber: '',
    department: '',
    semester: '',
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
    if (!formData.email.trim()) nextErrors.email = 'University email is required.';
    else if (!validateEmail(formData.email)) nextErrors.email = 'Enter a valid email format.';
    if (!formData.registerNumber.trim()) nextErrors.registerNumber = 'Register number is required.';
    if (!formData.department) nextErrors.department = 'Department is required.';
    if (!formData.semester) nextErrors.semester = 'Year/Semester is required.';

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
      registerNumber: formData.registerNumber,
      department: formData.department,
      semester: formData.semester,
      password: formData.password,
      role: 'student',
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    navigate('/login', {
      state: { message: 'Student account created successfully. Please login.' },
    });
  };

  return (
    <AuthShell>
      <AuthCard>
        <AuthHeader title="Create Student Account" subtitle="Register for Smart Campus portal access" />

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
            label="University Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="name@university.edu"
            error={errors.email}
          />

          <FormField
            id="registerNumber"
            label="Register Number / Student ID"
            value={formData.registerNumber}
            onChange={handleChange}
            placeholder="Ex: 22CSE1012"
            error={errors.registerNumber}
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

          <SelectField
            id="semester"
            label="Year / Semester"
            value={formData.semester}
            onChange={handleChange}
            error={errors.semester}
            options={semesterOptions}
            placeholder="Select year/semester"
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
            Create Account
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="secondary-link">
            Login
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
