var main = require('./index');

var context = {done: function(var1, var2) {console.log(var1), console.log(var2)}}

main.handler({ "Records": [ { "eventVersion": "2.0", "eventSource": "aws:s3", "awsRegion": "ap-northeast-1", "eventTime": "2015-07-03T12:31:10.347Z", "eventName": "ObjectCreated:Put", "userIdentity": { "principalId": "AWS:AROAIFZBFACFIIEQ4PWJY:awslambda_454_20150703100145661" }, "requestParameters": { "sourceIPAddress": "52.68.76.37" }, "responseElements": { "x-amz-request-id": "BE010E2F4FFCA63F", "x-amz-id-2": "VDyesNAdrvsXAAWNHMTU4JdhrLxJzriwQ2SfeCCHWK7QoNgX7bI6wYppYKZvmepDVPCDtZwKDVY=" }, "s3": { "s3SchemaVersion": "1.0", "configurationId": "OWM5OGQxYjctZTQ4NC00NGE3LWE1OWMtZDE0MDI0NDhjYjE2", "bucket": { "name": "dekokun-twittermap", "ownerIdentity": { "principalId": "A3QPNJ9WXMUVOU" }, "arn": "arn:aws:s3:::dekokun-twittermap" }, "object": { "key": "lambda", "size": 10, "eTag": "1570c07a663c5350c1b421cd8621e9ce" } } } ] }, context);
