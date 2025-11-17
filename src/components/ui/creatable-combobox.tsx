"use client"
 
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
 
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    options: { value: string; label: string }[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
}
 
export function CreatableCombobox({ options, value, onChange, placeholder }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value || "")
  const [filteredOptions, setFilteredOptions] = React.useState(options);

  React.useEffect(() => {
    setFilteredOptions(options);
    if (value) {
      const matchingOption = options.find(o => o.value.toLowerCase() === value.toLowerCase());
      setInputValue(matchingOption?.label || value);
    } else {
      setInputValue('');
    }
  }, [options, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    setInputValue(search);
    const newFilteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
    if (search && !newFilteredOptions.some(o => o.label.toLowerCase() === search.toLowerCase())) {
        newFilteredOptions.unshift({ value: search, label: `Crear "${search}"` });
    }
    setFilteredOptions(newFilteredOptions);
  }

  const handleSelect = (currentValue: string) => {
    const selectedOption = options.find(o => o.value.toLowerCase() === currentValue.toLowerCase());
    const finalValue = selectedOption ? selectedOption.value : currentValue;
    if (onChange) {
      onChange(finalValue);
    }
    setInputValue(finalValue);
    setOpen(false);
  }

  const displayLabel = value
    ? options.find((option) => option.value.toLowerCase() === value.toLowerCase())?.label || value
    : placeholder || "Select option...";
 
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
            <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={placeholder || "Search option..."}
            value={inputValue || ''}
            onInput={handleInputChange}
            onBlur={() => {
              const matchingOption = options.find(o => o.label.toLowerCase() === inputValue.toLowerCase());
              if (!matchingOption && !value) {
                 setInputValue('');
              } else if (matchingOption && matchingOption.value !== value) {
                 setInputValue(value ? options.find(o => o.value === value)?.label || value : '');
              }
            }}
          />
          <CommandList>
            <CommandEmpty>No se encontraron opciones.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value && value.toLowerCase() === option.value.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
