import type { Dispatch, SetStateAction, KeyboardEvent } from "react";

interface VotingOptionsProps {
  setIsFirstOptionSelected: Dispatch<SetStateAction<boolean>>;
  isFirstOptionSelected: boolean;
}

export default function VotingOptions({
  setIsFirstOptionSelected,
  isFirstOptionSelected,
}: VotingOptionsProps) {
  const onClickFirstOption = () => {
    setIsFirstOptionSelected(true);
  };

  const handleKeyDownFirstOption = (event: KeyboardEvent<HTMLLabelElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      onClickFirstOption();
    }
  };

  const onClickSecondOption = () => {
    setIsFirstOptionSelected(false);
  };

  const handleKeyDownSecondOption = (event: KeyboardEvent<HTMLLabelElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      onClickSecondOption();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mb-6 w-full max-w-md mx-auto">
      <h3 className="text-slate-300 text-sm font-medium mb-3">Choose your preference:</h3>
      <div className="grid sm:grid-cols-2 grid-cols-1 gap-3 p-2 rounded-xl bg-slate-700/30 border border-slate-600/50 backdrop-blur-sm w-full">
        <div>
          <input
            readOnly
            type="radio"
            name="votingOption"
            id="optionA"
            value="A"
            className="peer hidden"
            checked={isFirstOptionSelected}
            onChange={onClickFirstOption}
          />
          <label
            onClick={onClickFirstOption}
            onKeyDown={handleKeyDownFirstOption}
            htmlFor="optionA"
            className="block cursor-pointer select-none rounded-lg p-3 text-center text-sm transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-blue-500 peer-checked:text-white peer-checked:font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
          >
            Option A
          </label>
        </div>

        <div>
          <input
            readOnly
            type="radio"
            name="votingOption"
            id="optionB"
            value="B"
            className="peer hidden"
            checked={!isFirstOptionSelected}
            onChange={onClickSecondOption}
          />
          <label
            onClick={onClickSecondOption}
            onKeyDown={handleKeyDownSecondOption}
            htmlFor="optionB"
            className="block cursor-pointer select-none rounded-lg p-3 text-center text-sm transition-all duration-200 peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-blue-500 peer-checked:text-white peer-checked:font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
          >
            Option B
          </label>
        </div>
      </div>
    </div>
  );
}
