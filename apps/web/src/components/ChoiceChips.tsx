import { useId, type ReactElement } from "react";

interface ChoiceChipsProps<T extends string | number> {
  readonly legend: string;
  readonly options: readonly T[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly labelFor?: (option: T) => string;
  readonly pictureFor?: (option: T) => string;
}

export function ChoiceChips<T extends string | number>({
  legend,
  options,
  value,
  onChange,
  labelFor = String,
  pictureFor,
}: ChoiceChipsProps<T>): ReactElement {
  const name = useId();

  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className={pictureFor ? "grid grid-cols-3 gap-3" : "flex flex-wrap gap-3"}>
        {options.map((option) => (
          <label
            key={option}
            className={`${pictureFor ? "px-1 py-3 text-2xl sm:text-4xl" : "min-w-20 px-6 py-4 text-4xl"} cursor-pointer bg-plate text-center font-display font-black uppercase transition-colors hover:text-hazard has-checked:bg-iron-red has-checked:text-mat has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-hazard`}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={option === value}
              onChange={() => onChange(option)}
            />
            {/* The label's text already names the choice. */}
            {pictureFor && <img src={pictureFor(option)} alt="" className="h-52 w-full object-contain sm:h-80" />}
            {labelFor(option)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
