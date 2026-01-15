/**
 * Text Filter Component
 * Renders a text input for string filter values
 */

import { TextField } from '@mui/material';

interface TextFilterProps {
    name: string;
    label: string;
    value: string;
    onChange: (name: string, value: string) => void;
}

export default function TextFilter({ name, label, value, onChange }: TextFilterProps) {
    return (
        <TextField
            fullWidth
            label={label}
            value={value}
            onChange={(e) => onChange(name, e.target.value)}
            size="small"
            sx={{ mb: 1 }}
        />
    );
}
