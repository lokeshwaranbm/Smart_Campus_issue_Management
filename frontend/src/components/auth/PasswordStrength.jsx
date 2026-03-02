import { getStrengthBarClass, getPasswordStrength } from '../../utils/validation';

export default function PasswordStrength({ password }) {
  const { score, label } = getPasswordStrength(password);
  const width = `${Math.max(10, score * 20)}%`;

  return (
    <div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div className={`h-2 rounded-full transition-all ${getStrengthBarClass(score)}`} style={{ width }} />
      </div>
      <p className="mt-1 text-xs text-slate-600">Password strength: {label}</p>
    </div>
  );
}
