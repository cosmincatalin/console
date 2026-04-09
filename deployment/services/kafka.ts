import * as pulumi from '@pulumi/pulumi';
import { ServiceSecret } from '../utils/secrets';

export type Kafka = ReturnType<typeof deployKafka>;

export class KafkaSecret extends ServiceSecret<{
  ssl: '0' | '1' | pulumi.Output<'0' | '1'>;
  saslUsername: string | pulumi.Output<string>;
  saslPassword: string | pulumi.Output<string>;
  endpoint: string | pulumi.Output<string>;
}> {}

export function deployKafka() {
  const eventhubConfig = new pulumi.Config('eventhub');
  const saslMechanism = eventhubConfig.get('saslMechanism') ?? 'plain';

  const secret =
    saslMechanism === 'oauthbearer'
      ? new KafkaSecret('kafka', {
          ssl: '1',
          saslUsername: '',
          saslPassword: '',
          endpoint: eventhubConfig.require('endpoint'),
        })
      : new KafkaSecret('kafka', {
          ssl: '1',
          saslUsername: '$ConnectionString',
          saslPassword: eventhubConfig.requireSecret('key'),
          endpoint: eventhubConfig.require('endpoint'),
        });

  return {
    secret,
    config: {
      saslMechanism,
      concurrency: '1',
      bufferSize: eventhubConfig.require('bufferSize'),
      bufferInterval: eventhubConfig.require('bufferInterval'),
      bufferDynamic: eventhubConfig.require('bufferDynamic'),
      topic: eventhubConfig.require('topic'),
      consumerGroup: eventhubConfig.require('consumerGroup'),
      ...(saslMechanism === 'oauthbearer'
        ? { oauthbearerScope: eventhubConfig.require('oauthbearerScope') }
        : {}),
    },
  };
}
