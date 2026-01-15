/**
 * Filters Renderer Component
 * Renders the appropriate filter component based on filter type
 */

import { FilterTypes } from './types';
import type { Filters, FilterValues } from './types';
import SwitchFilter from './SwitchFilter';
import TextFilter from './TextFilter';
import SelectFilter from './SelectFilter';
import CheckboxFilter from './CheckboxFilter';
import TriStateFilter from './TriStateFilter';

interface FiltersRendererProps {
    filters: Filters;
    values: FilterValues;
    onChange: (name: string, value: any) => void;
}

export default function FiltersRenderer({ filters, values, onChange }: FiltersRendererProps) {
    if (!filters) return null;

    return (
        <>
            {Object.entries(filters).map(([key, filter]) => {
                const value = values[key] ?? filter.value;

                switch (filter.type) {
                    case FilterTypes.Switch:
                        return (
                            <SwitchFilter
                                key={key}
                                name={key}
                                label={filter.label}
                                value={Boolean(value)}
                                onChange={onChange}
                            />
                        );

                    case FilterTypes.TextInput:
                        return (
                            <TextFilter
                                key={key}
                                name={key}
                                label={filter.label}
                                value={String(value || '')}
                                onChange={onChange}
                            />
                        );

                    case FilterTypes.Picker:
                        return (
                            <SelectFilter
                                key={key}
                                name={key}
                                label={filter.label}
                                value={String(value || '')}
                                options={filter.options || []}
                                onChange={onChange}
                            />
                        );

                    case FilterTypes.CheckboxGroup:
                        return (
                            <CheckboxFilter
                                key={key}
                                name={key}
                                label={filter.label}
                                value={Array.isArray(value) ? value : []}
                                options={filter.options || []}
                                onChange={onChange}
                            />
                        );

                    case FilterTypes.ExcludableCheckboxGroup:
                        return (
                            <TriStateFilter
                                key={key}
                                name={key}
                                label={filter.label}
                                value={typeof value === 'object' ? value : { include: [], exclude: [] }}
                                options={filter.options || []}
                                onChange={onChange}
                            />
                        );

                    default:
                        console.warn(`Unknown filter type: ${(filter as any).type}`);
                        return null;
                }
            })}
        </>
    );
}
