import cx from "classnames";

interface ButtonProps {
  label: string;
  isLoading: boolean;
  handleRegister: () => void;
  disabled: boolean;
  color: "blue" | "purple" | "green" | "red" | "pink";
}

export default function Button({
    color,
    label,
    isLoading,
    disabled,
    handleRegister,
}: ButtonProps) {

    const className = cx(
      {
        "bg-blue-500/20 border-blue-500/50 text-blue-400 hover:bg-blue-500/30 hover:border-blue-400 focus:ring-blue-500/50":
          color === "blue" && !disabled,
        "bg-purple-500/20 border-purple-500/50 text-purple-400 hover:bg-purple-500/30 hover:border-purple-400 focus:ring-purple-500/50":
          color === "purple" && !disabled,
        "bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30 hover:border-green-400 focus:ring-green-500/50":
          color === "green" && !disabled,
        "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:border-red-400 focus:ring-red-500/50":
          color === "red" && !disabled,
        "bg-pink-500/20 border-pink-500/50 text-pink-400 hover:bg-pink-500/30 hover:border-pink-400 focus:ring-pink-500/50":
          color === "pink" && !disabled,
        "cursor-not-allowed bg-gray-500/10 border-gray-500/20 text-gray-500":
          disabled,
      },
      "flex h-12 justify-center items-center px-6 py-3 rounded-xl backdrop-blur-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 w-full font-medium"
    );

  return (
    <button
      onClick={handleRegister}
      disabled={isLoading || disabled}
      className={className}
    >
      {isLoading ? <div className="spinner"></div> : label}
    </button>
  );
}
