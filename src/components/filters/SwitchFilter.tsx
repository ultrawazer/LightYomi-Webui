/**
 * Switch Filter Component
 * Renders a toggle switch for boolean filter values
 */

import { FormControlLabel, Switch } from '@mui/material';

interface SwitchFilterProps {
    name: string;
    label: string;
    value: boolean;
    onChange: (name: string, value: boolean) => void;
}

export default function SwitchFilter({ name, label, value, onChange }: SwitchFilterProps) {
    return (
        <FormControlLabel
            control={
                <Switch
                    checked={value}
                    onChange={(e) => onChange(name, e.target.checked)}
                />
            }
            label={label}
            sx={{ width: '100%', m: 0, py: 0.5 }}
        />
    );
}
