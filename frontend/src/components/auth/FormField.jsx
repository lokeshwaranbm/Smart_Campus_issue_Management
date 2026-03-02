export default function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = true,
  children,
}) {
  return (
    <div>
      <label htmlFor={id} className="input-label">
        {label}
      </label>
      {children ? (
        children
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="input-field"
        />
      )}
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}
