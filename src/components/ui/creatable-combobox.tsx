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
    name: string;
    options: { value: string; label: string }[];
    defaultValue?: string;
    placeholder?: string;
}
 
export function CreatableCombobox({ name, options, defaultValue, placeholder }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(defaultValue || "")
  const [inputValue, setInputValue] = React.useState(defaultValue || "")
  const [filteredOptions, setFilteredOptions] = React.useState(options);

  React.useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

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
    setValue(finalValue);
    setInputValue(finalValue);
    setOpen(false);
  }
 
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
            <span className="truncate">
                {value
                    ? options.find((option) => option.value.toLowerCase() === value.toLowerCase())?.label || value
                    : placeholder || "Select option..."}
            </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={placeholder || "Search option..."}
            value={inputValue}
            onInput={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>No se encontraron opciones.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.toLowerCase() === option.value.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      <input type="hidden" name={name} value={value} />
    </Popover>
  )
}
