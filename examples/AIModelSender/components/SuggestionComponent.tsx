import React from 'react';
import { Suggestion } from '@ant-design/x';
import { suggestions } from './SuggestionConfig';
// import { useSuggestionHandler } from './SuggestionHandler';

interface SuggestionComponentProps {
  children: (props: { onTrigger: (show?: boolean) => void }) => React.ReactNode;
  onSuggestionSelect: (value: string) => void;
}

export const SuggestionComponent: React.FC<SuggestionComponentProps> = ({
  children,
  onSuggestionSelect
}) => {
  return (
    <Suggestion
      items={suggestions}
      onSelect={(itemVal) => {
        onSuggestionSelect(itemVal);
      }}
    >
      {({ onTrigger }) => {
        return children({ onTrigger }) as React.ReactElement;
      }}
    </Suggestion>
  );
};
