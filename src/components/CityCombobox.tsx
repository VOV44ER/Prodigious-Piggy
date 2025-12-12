import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
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

    const selectedCity = cities.find((city) => city.displayName === value);

    return (
        <Popover open={ open } onOpenChange={ setOpen }>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    role="combobox"
                    aria-expanded={ open }
                    className={ cn(
                        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                        "cursor-pointer text-left"
                    ) }
                >
                    <span className={ cn("truncate", !selectedCity && "text-muted-foreground") }>
                        { selectedCity?.displayName || placeholder }
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
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

