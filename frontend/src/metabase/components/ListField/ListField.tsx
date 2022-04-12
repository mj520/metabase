import React, { useMemo, useState } from "react";
import _ from "underscore";
import { t } from "ttag";
import { useDebouncedValue } from "metabase/hooks/use-debounced-value";
import { SEARCH_DEBOUNCE_DURATION } from "metabase/lib/constants";
import _Checkbox from "metabase/core/components/CheckBox";
import _EmptyState from "metabase/components/EmptyState";

import {
  OptionContainer,
  LabelWrapper,
  OptionsList,
  EmptyStateContainer,
  FilterInput,
} from "./ListField.styled";
import { ListFieldProps, Option } from "./types";

const Checkbox = _Checkbox as any;
const EmptyState = _EmptyState as any;

function createOptionsFromValuesWithoutOptions(
  values: string[],
  options: Option[],
): Option {
  const optionsMap = _.indexBy(options, "0");
  return values.filter(value => !optionsMap[value]).map(value => [value]);
}

const ListField = ({
  onChange,
  value,
  options,
  optionRenderer,
  placeholder,
  isDashboardFilter,
}: ListFieldProps) => {
  const [selectedValues, setSelectedValues] = useState(new Set(value));
  const [addedOptions, setAddedOptions] = useState<Option>(() =>
    createOptionsFromValuesWithoutOptions(value, options),
  );

  const augmentedOptions = useMemo(() => {
    return [...options.filter(option => option[0] != null), ...addedOptions];
  }, [addedOptions, options]);

  const sortedOptions = useMemo(() => {
    if (selectedValues.size === 0) {
      return augmentedOptions;
    }

    const [selected, unselected] = _.partition(augmentedOptions, option =>
      selectedValues.has(option[0]),
    );

    return [...selected, ...unselected];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [augmentedOptions.length]);

  const [filter, setFilter] = useState("");
  const debouncedFilter = useDebouncedValue(filter, SEARCH_DEBOUNCE_DURATION);

  const filteredOptions = useMemo(() => {
    const trimmedFilter = debouncedFilter.trim().toLowerCase();
    if (trimmedFilter.length === 0) {
      return sortedOptions;
    }

    return augmentedOptions.filter(option => {
      // option is: [id, name]
      if (
        option.length > 1 &&
        String(option[1])
          .toLowerCase()
          .indexOf(trimmedFilter) > -1
      ) {
        return true;
      }

      // option is: [id]
      return String(option[0])
        .toLowerCase()
        .includes(trimmedFilter);
    });
  }, [augmentedOptions, debouncedFilter, sortedOptions]);

  const shouldShowEmptyState =
    augmentedOptions.length > 0 && filteredOptions.length === 0;

  const handleToggleOption = (option: any) => {
    const newSelectedValues = selectedValues.has(option)
      ? Array.from(selectedValues).filter(value => value !== option)
      : [...selectedValues, option];

    setSelectedValues(new Set(newSelectedValues));
    onChange?.(newSelectedValues);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (
      event.key === "Enter" &&
      !_.find(augmentedOptions, option => option[0] === filter)
    ) {
      setAddedOptions([...addedOptions, [filter]]);
    }
  };

  return (
    <>
      <FilterInput
        isDashboardFilter={isDashboardFilter}
        padding={isDashboardFilter ? "md" : "sm"}
        borderRadius={isDashboardFilter ? "md" : "sm"}
        colorScheme={isDashboardFilter ? "transparent" : "admin"}
        placeholder={placeholder}
        value={filter}
        onChange={setFilter}
        onKeyDown={handleKeyDown}
        hasClearButton
        autoFocus
      />

      {shouldShowEmptyState && (
        <EmptyStateContainer>
          <EmptyState message={t`Didn't find anything`} icon="search" />
        </EmptyStateContainer>
      )}

      <OptionsList isDashboardFilter={isDashboardFilter}>
        {filteredOptions.map(option => (
          <OptionContainer key={option[0]}>
            <Checkbox
              data-testid={`${option[0]}-filter-value`}
              checkedColor={isDashboardFilter ? "brand" : "accent7"}
              checked={selectedValues.has(option[0])}
              label={<LabelWrapper>{optionRenderer(option)}</LabelWrapper>}
              onChange={() => handleToggleOption(option[0])}
            />
          </OptionContainer>
        ))}
      </OptionsList>
    </>
  );
};

export default ListField;
