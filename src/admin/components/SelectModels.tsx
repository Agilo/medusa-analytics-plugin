// External packages
import * as React from 'react';
import { Control, useController } from 'react-hook-form';
import { Select, Text } from '@medusajs/ui';

// Internal
import { useRetrieveModels } from '../hooks/ai-dashboard';
import { idLabels, normalizeGatewayModels } from '../lib/utils/models';
import { AnalyticsChatInput } from '../../api/admin/agilo-analytics/analytics-ai/chat/validators';

export const SelectModels = ({
  control,
}: {
  control: Control<AnalyticsChatInput>;
}) => {
  const { data, isPending } = useRetrieveModels();

  const models = React.useMemo(
    () => (Array.isArray(data) ? normalizeGatewayModels(data) : []),
    [data],
  );

  const {
    field: { value, onChange },
  } = useController({ control, name: 'modelId' });

  const selectedModel = React.useMemo(
    () => models.find((m) => m.id === value),
    [models, value],
  );

  React.useEffect(() => {
    if (models.length === 0) {
      return;
    }

    const hasSelectedModel = models.some((model) => model.id === value);

    if (!hasSelectedModel) {
      onChange(models[0].id);
    }
  }, [value, models, onChange]);

  return (
    <Select value={value} onValueChange={onChange} size="small">
      <Select.Trigger className="min-w-40 px-2">
        <Select.Value>
          {isPending && !data
            ? 'Loading models...'
            : (selectedModel?.name ?? 'Select a model')}
        </Select.Value>
      </Select.Trigger>
      <Select.Content
        className="max-h-64 w-(--radix-select-trigger-width) overflow-y-scroll scrollbar-thin scrollbar-thumb-ui-bg-subtle scrollbar-track-ui-bg-base"
        position="popper"
      >
        {Object.values(idLabels)
          .filter((provider) => models.some((m) => m.prettyName === provider))
          .map((provider) => (
            <Select.Group key={provider}>
              <Select.Label>{provider}</Select.Label>
              {models
                .filter((m) => m.prettyName === provider)
                .map((m) => (
                  <Select.Item key={m.id} value={m.id}>
                    <div className="flex items-center justify-between gap-3 w-full">
                      <Text as="span" size="small" weight="plus">
                        {m.name}
                      </Text>
                    </div>
                  </Select.Item>
                ))}
            </Select.Group>
          ))}
      </Select.Content>
    </Select>
  );
};
