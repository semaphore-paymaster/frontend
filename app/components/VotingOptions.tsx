import { Dispatch, SetStateAction } from "react";

interface VotingOptionsProps {
  setIsFirstOptionSelected: Dispatch<SetStateAction<boolean>>;
  isFirstOptionSelected: boolean;
}

export default function VotingOptions({
  setIsFirstOptionSelected,
  isFirstOptionSelected,
}: VotingOptionsProps) {
  const onClick = () => {
    setIsFirstOptionSelected(!isFirstOptionSelected);
  };

  return (
    <div className="flex flex-col items-center justify-center mb-6">
      <h3 className="text-white/90 text-sm font-medium mb-3">Choose your preference:</h3>
      <div className="grid sm:grid-cols-2 grid-cols-1 gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <div>
          <input
            readOnly
            type="radio"
            name="option"
            id="1"
            value="1"
            className="peer hidden"
            checked={isFirstOptionSelected}
          />
          <label
            onClick={onClick}
            htmlFor="1"
            className="block cursor-pointer select-none rounded-lg p-3 text-center text-sm transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-yellow-500 peer-checked:to-orange-500 peer-checked:text-black peer-checked:font-semibold text-white/70 hover:text-white hover:bg-white/5"
          >
            Pizza 🍕 + Pineapple 🍍
          </label>
        </div>

        <div>
          <input
            readOnly
            type="radio"
            name="option"
            id="2"
            value="2"
            className="peer hidden"
            checked={!isFirstOptionSelected}
          />
          <label
            onClick={onClick}
            htmlFor="2"
            className="block cursor-pointer select-none rounded-lg p-3 text-center text-sm transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-yellow-500 peer-checked:to-orange-500 peer-checked:text-black peer-checked:font-semibold text-white/70 hover:text-white hover:bg-white/5"
          >
            Just Pizza! 🍕
          </label>
        </div>
      </div>
    </div>
  );
}
