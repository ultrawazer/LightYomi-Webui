/**
 * Checkbox Group Filter Component
 * Renders a list of checkboxes for multi-select filter values
 */

import { FormGroup, FormControlLabel, Checkbox, Typography, Box } from '@mui/material';

interface CheckboxFilterProps {
    name: string;
    label: string;
    value: string[];
    options: { label: string; value: string }[];
    onChange: (name: string, value: string[]) => void;
}

export default function CheckboxFilter({ name, label, value, options, onChange }: CheckboxFilterProps) {
    const handleToggle = (optValue: string) => {
        const newValue = value.includes(optValue)
            ? value.filter(v => v !== optValue)
            : [...value, optValue];
        onChange(name, newValue);
    };

    return (
        <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                {label}
            </Typography>
            <FormGroup>
                {options.map((opt) => (
                    <FormControlLabel
                        key={opt.value}
                        control={
                            <Checkbox
                                checked={value.includes(opt.value)}
                                onChange={() => handleToggle(opt.value)}
                                size="small"
                            />
                        }
                        label={opt.label}
                        sx={{ m: 0 }}
                    />
                ))}
            </FormGroup>
        </Box>
    );
}
