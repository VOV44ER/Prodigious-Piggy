import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cities, type City } from "@/data/cities";

interface CityComboboxProps {
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
}

export function CityCombobox({ value, onValueChange, placeholder = "Select city..." }: CityComboboxProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={ open } onOpenChange={ setOpen }>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={ open }
                    className="w-full justify-between"
                >
                    { value
                        ? cities.find((city) => city.displayName === value)?.displayName || value
                        : placeholder }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search city..." />
                    <CommandList>
                        <CommandEmpty>
                            No city found.
                        </CommandEmpty>
                        <CommandGroup>
                            { cities.map((city) => (
                                <CommandItem
                                    key={ city.displayName }
                                    value={ city.displayName }
                                    onSelect={ () => {
                                        onValueChange(city.displayName);
                                        setOpen(false);
                                    } }
                                >
                                    <Check
                                        className={ cn(
                                            "mr-2 h-4 w-4",
                                            value === city.displayName ? "opacity-100" : "opacity-0"
                                        ) }
                                    />
                                    { city.displayName }
                                </CommandItem>
                            )) }
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

