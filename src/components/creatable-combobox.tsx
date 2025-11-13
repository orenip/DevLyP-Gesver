'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type Item = {
  value: string;
  label: string;
};

interface CreatableComboboxProps {
  items: Item[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  createLabel: string;
}

export function CreatableCombobox({
  items,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  createLabel,
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  const handleSelect = (currentValue: string) => {
    onChange(currentValue === value ? '' : currentValue);
    setOpen(false);
  };
  
  const handleCreate = () => {
    if (inputValue && !items.find(item => item.label.toLowerCase() === inputValue.toLowerCase())) {
        onChange(inputValue);
    }
    setOpen(false);
  };

  const filteredItems = items.filter(item => item.label.toLowerCase().includes(inputValue.toLowerCase()));
  const showCreateOption = inputValue && !items.find(item => item.label.toLowerCase() === inputValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? items.find((item) => item.label.toLowerCase() === value.toLowerCase())?.label ?? value
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
                {!showCreateOption && emptyMessage}
            </CommandEmpty>
            <CommandGroup>
              {filteredItems.map((item) => (
                <CommandItem
                  key={item.value}
                  onSelect={handleSelect}
                  value={item.label}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value && value.toLowerCase() === item.label.toLowerCase() ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
               {showCreateOption && (
                <CommandItem onSelect={handleCreate} className="text-primary">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {createLabel} "{inputValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
