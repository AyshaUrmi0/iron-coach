import { useId, type ReactElement } from "react";

interface ChoiceChipsProps<T extends string | number> {
  readonly legend: string;
  readonly options: readonly T[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly labelFor?: (option: T) => string;
}

export function ChoiceChips<T extends string | number>({
  legend,
  options,
  value,
  onChange,
  labelFor = String,
}: ChoiceChipsProps<T>): ReactElement {
  const name = useId();

  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <label
            key={option}
            className="min-w-20 cursor-pointer bg-plate px-6 py-4 text-center font-display text-4xl font-black uppercase transition-colors hover:text-hazard has-checked:bg-iron-red has-checked:text-mat has-focus-visible:outline-3 has-focus-visible:outline-offset-3 has-focus-visible:outline-hazard"
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={option === value}
              onChange={() => onChange(option)}
            />
            {labelFor(option)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
