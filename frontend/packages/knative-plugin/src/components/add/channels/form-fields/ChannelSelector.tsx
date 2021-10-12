import * as React from 'react';
import { useField } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { DropdownField, DropdownFieldProps } from '@console/shared';
import { EventingChannelModel } from '../../../../models';
import { getChannelKind } from '../../../../utils/create-channel-utils';

type ChannelSelectorProps = {
  channels: string[];
  defaultConfiguredChannel: string;
} & Omit<DropdownFieldProps, 'name'>;

const ChannelSelector: React.FC<ChannelSelectorProps> = ({
  channels,
  onChange,
  defaultConfiguredChannel,
}) => {
  const [selected] = useField('type');
  const { t } = useTranslation();
  const filteredChannels = _.flatten(
    _.partition(channels, (ref) => getChannelKind(ref) === EventingChannelModel.kind),
  );

  const channelData = filteredChannels.reduce((acc, channel) => {
    const channelName = getChannelKind(channel);
    acc[channel] =
      channelName === EventingChannelModel.kind && defaultConfiguredChannel
        ? t('knative-plugin~Default {{channelName}} ({{defaultConfiguredChannel}})', {
            channelName,
            defaultConfiguredChannel,
          })
        : channelName;
    return acc;
  }, {});

  const getGenericChannel = React.useCallback((): string => {
    return (
      filteredChannels.find((ch) => getChannelKind(ch) === EventingChannelModel.kind) ||
      filteredChannels[0]
    );
  }, [filteredChannels]);

  React.useEffect(() => {
    if (!selected.value && filteredChannels.length > 0) {
      const channel = getGenericChannel();
      onChange && onChange(channel);
    }
  }, [selected.value, getGenericChannel, onChange, filteredChannels.length]);

  return (
    <FormSection extraMargin>
      <DropdownField
        name="type"
        label={t('knative-plugin~Type')}
        items={channelData}
        title={t('knative-plugin~Type')}
        onChange={onChange}
        fullWidth
        required
      />
    </FormSection>
  );
};

export default ChannelSelector;
