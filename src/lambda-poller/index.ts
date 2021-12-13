const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require("@aws-sdk/client-sqs");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

// Create SQS client
var sqsclient = new SQSClient({
    region: process.env.AWS_REGION
});

// Create DynamoDB client
var ddbclient = new DynamoDBClient({
    region: process.env.AWS_REGION
});

exports.handler = async (event: any, context: any) => {
    
    // Get message from SQS
    const sqsMsg = await sqsclient.send(new ReceiveMessageCommand({
        QueueUrl: process.env.QUEUE_URL,
        AttributeNames: ['All'],
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 0
    }));

    console.log(sqsMsg);

    // Check if response contains messages
    if (sqsMsg.Messages) {

        console.log(sqsMsg.Messages);

        for (const message of sqsMsg.Messages) {

            // Get message body
            console.log(message);

            // Put message to DynamoDB
            /*
            const ddbData = await ddbclient.send(new PutItemCommand({
                TableName: process.env.TABLE_NAME,
                Item: {
                    timest: 1, //Number(Date.now().toString().slice(0, -3)), 
                    //id: message.MessageId,
                    //message: message.Body,
                    fullmsg: message
                }
            }));
            */

            // Delete message from SQS
            const sqsData = await sqsclient.send(new DeleteMessageCommand({
                QueueUrl: process.env.QUEUE_URL,
                ReceiptHandle: message.ReceiptHandle
            }));
        };

    } else {
        console.log('No messages in queue');

    };

    return(sqsMsg.$metadata);
};
