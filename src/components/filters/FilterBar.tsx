import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  onFilterChange?: (filters: Record<string, string[]>) => void;
}

const listOptions: FilterOption[] = [
  { value: "favourites", label: "❤️ Favourites" },
  { value: "want_to_go", label: "🔖 Want to Go" },
];

const priceOptions: FilterOption[] = [
  { value: "1", label: "$" },
  { value: "2", label: "$$" },
  { value: "3", label: "$$$" },
  { value: "4", label: "$$$$" },
];

const cuisineOptions: FilterOption[] = [
  { value: "moroccan", label: "Moroccan" },
  { value: "mediterranean", label: "Mediterranean" },
  { value: "international", label: "International" },
  { value: "french", label: "French" },
  { value: "african", label: "African" },
  { value: "coffee", label: "Coffee" },
  { value: "japanese", label: "Japanese" },
  { value: "italian", label: "Italian" },
  { value: "british", label: "British" },
  { value: "indian", label: "Indian" },
  { value: "mexican", label: "Mexican" },
  { value: "chinese", label: "Chinese" },
  { value: "thai", label: "Thai" },
];

const categoryOptions: FilterOption[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Café" },
  { value: "bakery", label: "Bakery" },
  { value: "bar", label: "Bar" },
  { value: "landmark", label: "Landmark" },
];

const styleOptions: FilterOption[] = [
  { value: "pub", label: "Pub" },
  { value: "fine_dining", label: "Fine Dining" },
  { value: "casual", label: "Casual" },
  { value: "street_food", label: "Street Food" },
  { value: "rooftop", label: "Rooftop" },
  { value: "hidden_gem", label: "Hidden Gem" },
];

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleFilter = (category: string, value: string) => {
    const current = activeFilters[category] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    const newFilters = {
      ...activeFilters,
      [category]: updated,
    };

    if (updated.length === 0) {
      delete newFilters[category];
    }

    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    onFilterChange?.({});
  };

  const activeCount = Object.values(activeFilters).flat().length;

  return (
    <div className="bg-card border-b border-border relative">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide" style={ { overflowY: 'visible' } }>
          <div className="flex items-center gap-1 text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="text-sm font-medium whitespace-nowrap">Filters</span>
          </div>

          <FilterDropdown
            label="List"
            options={ listOptions }
            selected={ activeFilters.list || [] }
            onToggle={ (value) => toggleFilter("list", value) }
            isOpen={ openDropdown === "list" }
            onOpenChange={ (open) => setOpenDropdown(open ? "list" : null) }
          />

          <FilterDropdown
            label="Price"
            options={ priceOptions }
            selected={ activeFilters.price || [] }
            onToggle={ (value) => toggleFilter("price", value) }
            isOpen={ openDropdown === "price" }
            onOpenChange={ (open) => setOpenDropdown(open ? "price" : null) }
          />

          <FilterDropdown
            label="Cuisine"
            options={ cuisineOptions }
            selected={ activeFilters.cuisine || [] }
            onToggle={ (value) => toggleFilter("cuisine", value) }
            isOpen={ openDropdown === "cuisine" }
            onOpenChange={ (open) => setOpenDropdown(open ? "cuisine" : null) }
          />

          <FilterDropdown
            label="Category"
            options={ categoryOptions }
            selected={ activeFilters.category || [] }
            onToggle={ (value) => toggleFilter("category", value) }
            isOpen={ openDropdown === "category" }
            onOpenChange={ (open) => setOpenDropdown(open ? "category" : null) }
          />

          <FilterDropdown
            label="Style"
            options={ styleOptions }
            selected={ activeFilters.style || [] }
            onToggle={ (value) => toggleFilter("style", value) }
            isOpen={ openDropdown === "style" }
            onOpenChange={ (open) => setOpenDropdown(open ? "style" : null) }
          />

          { activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={ clearFilters }
              className="text-muted-foreground hover:text-destructive ml-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Clear ({ activeCount })
            </Button>
          ) }
        </div>
      </div>
    </div>
  );
}

interface FilterDropdownProps {
  label: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
  isOpen,
  onOpenChange,
}: FilterDropdownProps) {
  const hasSelection = selected.length > 0;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  return (
    <>
      <div className="relative">
        <button
          ref={ buttonRef }
          onClick={ () => onOpenChange(!isOpen) }
          className={ cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
            hasSelection
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-accent"
          ) }
        >
          { label }
          { hasSelection && <span className="text-xs">({ selected.length })</span> }
          <ChevronDown className={ cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180") } />
        </button>
      </div>

      <AnimatePresence>
        { isOpen && dropdownPosition && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={ () => onOpenChange(false) }
            />
            <motion.div
              initial={ { opacity: 0, y: 4 } }
              animate={ { opacity: 1, y: 0 } }
              exit={ { opacity: 0, y: 4 } }
              style={ {
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                zIndex: 50,
                width: 'max-content',
                maxWidth: '200px',
              } }
              className="bg-popover border border-border rounded-xl shadow-elevated p-2"
            >
              { options.map((option) => (
                <button
                  key={ option.value }
                  onClick={ () => onToggle(option.value) }
                  className={ cn(
                    "block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap",
                    selected.includes(option.value)
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-accent text-foreground"
                  ) }
                >
                  { option.label }
                </button>
              )) }
            </motion.div>
          </>
        ) }
      </AnimatePresence>
    </>
  );
}
