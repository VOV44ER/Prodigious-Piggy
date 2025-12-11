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

interface City {
    name: string;
    country: string;
    displayName: string;
}

interface CityComboboxProps {
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
}

export function CityCombobox({ value, onValueChange, placeholder = "Select city..." }: CityComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [cities, setCities] = React.useState<City[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const fetchCities = async () => {
            setLoading(true);
            try {
                const response = await fetch('https://countriesnow.space/api/v0.1/countries/population/cities');
                if (response.ok) {
                    const data = await response.json();
                    if (data.data && Array.isArray(data.data)) {
                        const cityList: City[] = data.data.map((item: any) => ({
                            name: item.city,
                            country: item.country,
                            displayName: `${item.city}, ${item.country}`,
                        }));
                        const uniqueCities = cityList.filter((city, index, self) =>
                            index === self.findIndex((c) => c.displayName === city.displayName)
                        );
                        setCities(uniqueCities.sort((a, b) => a.displayName.localeCompare(b.displayName)));
                    } else {
                        throw new Error('Invalid response format');
                    }
                } else {
                    throw new Error('Failed to fetch cities');
                }
            } catch (error) {
                console.error('Error fetching cities:', error);
                const fallbackCities: City[] = [
                    { name: "New York", country: "USA", displayName: "New York, USA" },
                    { name: "Los Angeles", country: "USA", displayName: "Los Angeles, USA" },
                    { name: "Chicago", country: "USA", displayName: "Chicago, USA" },
                    { name: "London", country: "UK", displayName: "London, UK" },
                    { name: "Manchester", country: "UK", displayName: "Manchester, UK" },
                    { name: "Paris", country: "France", displayName: "Paris, France" },
                    { name: "Lyon", country: "France", displayName: "Lyon, France" },
                    { name: "Tokyo", country: "Japan", displayName: "Tokyo, Japan" },
                    { name: "Osaka", country: "Japan", displayName: "Osaka, Japan" },
                    { name: "Berlin", country: "Germany", displayName: "Berlin, Germany" },
                    { name: "Munich", country: "Germany", displayName: "Munich, Germany" },
                    { name: "Madrid", country: "Spain", displayName: "Madrid, Spain" },
                    { name: "Barcelona", country: "Spain", displayName: "Barcelona, Spain" },
                    { name: "Rome", country: "Italy", displayName: "Rome, Italy" },
                    { name: "Milan", country: "Italy", displayName: "Milan, Italy" },
                    { name: "Amsterdam", country: "Netherlands", displayName: "Amsterdam, Netherlands" },
                    { name: "Casablanca", country: "Morocco", displayName: "Casablanca, Morocco" },
                    { name: "Rabat", country: "Morocco", displayName: "Rabat, Morocco" },
                ];
                setCities(fallbackCities);
            } finally {
                setLoading(false);
            }
        };

        fetchCities();
    }, []);

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
                            { loading ? "Loading cities..." : "No city found." }
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

