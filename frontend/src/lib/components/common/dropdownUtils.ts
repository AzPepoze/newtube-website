export interface DropdownOption {
    value?: string;
    label: string;
    group?: string;
    icon?: any;
    href?: string;
    onClick?: () => void;
    class?: string;
    color?: string;
}

export function groupDropdownOptions(
    options: DropdownOption[],
): Record<string, DropdownOption[]> {
    const groups: Record<string, DropdownOption[]> = {};
    for (const opt of options) {
        const grp = opt.group || "";
        if (!groups[grp]) {
            groups[grp] = [];
        }
        groups[grp].push(opt);
    }
    return groups;
}

export function getSelectedLabel(
    options: DropdownOption[],
    value?: string,
    placeholder = "Select an option",
    multiple = false,
    selectedValues: string[] = [],
): string {
    if (multiple) {
        return selectedValues.length === 0
            ? placeholder
            : `${selectedValues.length} selected`;
    }
    return options.find((opt) => opt.value === value)?.label || placeholder;
}

export function handleOptionSelect(
    option: DropdownOption,
    multiple: boolean,
    selectedValues: string[],
    onChange?: (val: string) => void,
    onValuesChange?: (vals: string[]) => void,
): { nextValue?: string; nextSelectedValues?: string[]; shouldClose: boolean } {
    if (option.onClick) {
        option.onClick();
    } else if (option.value !== undefined) {
        if (multiple) {
            const nextSelected = selectedValues.includes(option.value)
                ? selectedValues.filter((item) => item !== option.value)
                : [...selectedValues, option.value];
            onValuesChange?.(nextSelected);
            return { nextSelectedValues: nextSelected, shouldClose: false };
        }
        onChange?.(option.value);
        return { nextValue: option.value, shouldClose: true };
    }
    return { shouldClose: true };
}
