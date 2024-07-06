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
    <div className="flex flex-col items-center justify-center my-4">
      <div className="grid w-[30rem] grid-cols-2 gap-2 rounded-xl bg-black p-2 border">
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
            className="block cursor-pointer select-none rounded-xl p-2 text-center peer-checked:bg-yellow-500 peer-checked:font-bold peer-checked:text-black"
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
          />
          <label
            onClick={onClick}
            htmlFor="2"
            className="block cursor-pointer select-none rounded-xl p-2 text-center peer-checked:bg-yellow-500 peer-checked:font-bold peer-checked:text-black"
          >
            Just Pizza! 🍕
          </label>
        </div>
      </div>
    </div>
  );
}
