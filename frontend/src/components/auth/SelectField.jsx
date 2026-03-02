export default function SelectField({ id, label, value, onChange, error, options, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="input-label">
        {label}
      </label>
      <select id={id} name={id} value={value} onChange={onChange} required className="input-field">
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}
