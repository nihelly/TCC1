
export const Input = ({ label, tipo = 'text', placeholder, valor, aoMudar }) => {
  const inputId = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1 w-full mb-4">
      <label htmlFor={inputId} className="text-xs font-bold text-gray-500 ml-1 uppercase">
        {label}
      </label>
      <input
        id={inputId}
        name={inputId}
        type={tipo}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black transition-all outline-none"
      />
    </div>
  );
};