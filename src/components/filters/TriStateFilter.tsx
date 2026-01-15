/**
 * Tri-State Filter Component (Excludable Checkbox)
 * Renders checkboxes with three states: unchecked, included (checked), excluded (indeterminate with X)
 * Used for filtering where you can include OR exclude certain options
 */

import { useState } from 'react';
import { FormGroup, FormControlLabel, Checkbox, Typography, Box, IconButton, Tooltip } from '@mui/material';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';

interface TriStateFilterProps {
    name: string;
    label: string;
    value: { include?: string[]; exclude?: string[] };
    options: { label: string; value: string }[];
    onChange: (name: string, value: { include?: string[]; exclude?: string[] }) => void;
}

type TriState = 'none' | 'include' | 'exclude';

export default function TriStateFilter({ name, label, value, options, onChange }: TriStateFilterProps) {
    const getState = (optValue: string): TriState => {
        if (value.include?.includes(optValue)) return 'include';
        if (value.exclude?.includes(optValue)) return 'exclude';
        return 'none';
    };

    const cycleState = (optValue: string) => {
        const currentState = getState(optValue);
        let newInclude = [...(value.include || [])];
        let newExclude = [...(value.exclude || [])];

        // Remove from both arrays first
        newInclude = newInclude.filter(v => v !== optValue);
        newExclude = newExclude.filter(v => v !== optValue);

        // Cycle: none -> include -> exclude -> none
        if (currentState === 'none') {
            newInclude.push(optValue);
        } else if (currentState === 'include') {
            newExclude.push(optValue);
        }
        // 'exclude' -> back to 'none' (already removed)

        onChange(name, { include: newInclude, exclude: newExclude });
    };

    const renderCheckbox = (optValue: string) => {
        const state = getState(optValue);
        if (state === 'include') {
            return <CheckBoxIcon color="primary" />;
        } else if (state === 'exclude') {
            return <IndeterminateCheckBoxIcon color="error" />;
        }
        return <CheckBoxOutlineBlankIcon />;
    };

    return (
        <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                {label}
                <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                    (click to cycle: none → include → exclude)
                </Typography>
            </Typography>
            <FormGroup>
                {options.map((opt) => (
                    <FormControlLabel
                        key={opt.value}
                        control={
                            <Checkbox
                                checked={getState(opt.value) !== 'none'}
                                indeterminate={getState(opt.value) === 'exclude'}
                                onChange={() => cycleState(opt.value)}
                                size="small"
                                icon={<CheckBoxOutlineBlankIcon />}
                                checkedIcon={<CheckBoxIcon />}
                                indeterminateIcon={<IndeterminateCheckBoxIcon color="error" />}
                            />
                        }
                        label={opt.label}
                        sx={{
                            m: 0,
                            color: getState(opt.value) === 'exclude' ? 'error.main' : 'inherit'
                        }}
                    />
                ))}
            </FormGroup>
        </Box>
    );
}
