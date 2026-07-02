
export const Button = ({ children, tipo = "submit", carregando = false }) => {
  return (
    <button
      type={tipo}
      disabled={carregando}
      className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all cursor-pointer disabled:opacity-50"
    >
      {carregando ? "Carregando..." : children}
    </button>
  );
};