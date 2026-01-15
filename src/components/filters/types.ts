/**
 * Filter Types - matches LNReader plugin filter types
 */

export enum FilterTypes {
    TextInput = 'Text',
    Picker = 'Picker',
    CheckboxGroup = 'Checkbox',
    Switch = 'Switch',
    ExcludableCheckboxGroup = 'XCheckbox',
}

export interface FilterOption {
    label: string;
    value: string;
}

export interface BaseFilter {
    label: string;
    type: FilterTypes;
}

export interface SwitchFilter extends BaseFilter {
    type: FilterTypes.Switch;
    value: boolean;
}

export interface TextFilter extends BaseFilter {
    type: FilterTypes.TextInput;
    value: string;
}

export interface PickerFilter extends BaseFilter {
    type: FilterTypes.Picker;
    options: FilterOption[];
    value: string;
}

export interface CheckboxFilter extends BaseFilter {
    type: FilterTypes.CheckboxGroup;
    options: FilterOption[];
    value: string[];
}

export interface ExcludableCheckboxFilter extends BaseFilter {
    type: FilterTypes.ExcludableCheckboxGroup;
    options: FilterOption[];
    value: { include?: string[]; exclude?: string[] };
}

export type Filter = SwitchFilter | TextFilter | PickerFilter | CheckboxFilter | ExcludableCheckboxFilter;

export type Filters = Record<string, Filter>;

export type FilterValues = Record<string, any>;
