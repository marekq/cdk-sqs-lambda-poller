import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

export class CdkSqsLambdaPollerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sqsQueue = new Queue(this, 'SqsQueue.fifo', {
      visibilityTimeout: Duration.seconds(1),
      fifo: true,
      retentionPeriod: Duration.days(7)
    });


    const lambdaPollerFunction = new NodejsFunction(this, 'LambdaPollerFunction', {
      entry: './src/lambda-poller/index.ts',
      handler: 'handler',
      timeout: Duration.seconds(5),
      memorySize: 128,
      tracing: Tracing.ACTIVE,
      environment: {
        QUEUE_URL: sqsQueue.queueUrl
      },
      deadLetterQueueEnabled: true
    });


    const cronRule = new Rule(this, 'EventRule', {
      schedule: Schedule.rate(Duration.minutes(1)),
    });

    cronRule.addTarget(new LambdaFunction(lambdaPollerFunction));
    sqsQueue.grantConsumeMessages(lambdaPollerFunction);    
  }
}
