/**
 * Select Filter Component (Picker)
 * Renders a dropdown select for single-choice filter values
 */

import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

interface SelectFilterProps {
    name: string;
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onChange: (name: string, value: string) => void;
}

export default function SelectFilter({ name, label, value, options, onChange }: SelectFilterProps) {
    return (
        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>{label}</InputLabel>
            <Select
                value={value}
                label={label}
                onChange={(e) => onChange(name, e.target.value)}
            >
                {options.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
