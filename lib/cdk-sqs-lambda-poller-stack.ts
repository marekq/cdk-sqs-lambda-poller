import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Architecture, Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';

export class CdkSqsLambdaPollerStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const ddbTable = new Table(this, 'DdbTable', {
      partitionKey: {
        name: 'timest',
        type: AttributeType.NUMBER,
      },
      sortKey: {
        name: 'id',
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    
    const sqsQueue = new Queue(this, 'SqsQueue.fifo', {
      visibilityTimeout: Duration.seconds(5),
      fifo: true,
      contentBasedDeduplication: false,
      retentionPeriod: Duration.days(7)
    });

    const lambdaPollerFunction = new NodejsFunction(this, 'LambdaPollerFunction', {
      entry: './src/lambda-poller/index.ts',
      handler: 'handler',
      timeout: Duration.seconds(5),
      memorySize: 256,
      tracing: Tracing.ACTIVE,
      architecture: Architecture.ARM_64,
      environment: {
        QUEUE_URL: sqsQueue.queueUrl,
        TABLE_NAME: ddbTable.tableName
      },
      deadLetterQueueEnabled: true
    });

    ddbTable.grantReadWriteData(lambdaPollerFunction);

    const cronRule = new Rule(this, 'EventRule', {
      schedule: Schedule.rate(Duration.minutes(1)),
    });

    cronRule.addTarget(new LambdaFunction(lambdaPollerFunction));
    sqsQueue.grantConsumeMessages(lambdaPollerFunction);    
  }
}
