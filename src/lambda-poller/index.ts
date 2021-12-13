var awssdk = require('aws-sdk');

var sqsclient = new awssdk.SQS({
    region: process.env.AWS_REGION
});

exports.handler = async (event: any, context: any) => {
    
    const msg = await sqsclient.receiveMessage({
        QueueUrl: process.env.QUEUE_URL,
        MaxNumberOfMessages: 1,
        VisibilityTimeout: 30,
        WaitTimeSeconds: 0
    }).promise();

    console.log(msg);

    return msg;
}