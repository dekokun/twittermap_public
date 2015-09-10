console.log('Loading event');
var aws = require('aws-sdk');
var s3 = new aws.S3({apiVersion: '2006-03-01', region: "ap-northeast-1"});
var Twitter = require('twitter');
var _ = require('underscore');
var moment = require('moment-timezone');

var interval = 20 * 1000 // 処理のインターバル
var target_bucket = 'dekokoun-twittermap-lambda';
var target_file = 'trigger';
var json_bucket = 'twittermap.dekokun.info';
var json_file = 'tweets.json';

// s3file ジョブコントロールのステータスをアップデートしています
function change_status(body, callback) {
  s3.putObject({
      Bucket: target_bucket,
      Key: target_file,
      ACL: 'public-read',
      Body: new Buffer(
        body+'', 'binary'
      ), // update running...
      ContentType: 'application/json'
  }, callback);
}

function update_json(new_data, callback) {
  s3.getObject({Bucket:json_bucket, Key:json_file},
    function(err,data) {
      if (err) {
        throw new Error(err);
      }
      var body = data.Body.toString("utf8");
      var before_data;
      before_data = JSON.parse(body);
      // since_idを指定しても型丸めの影響か以前のtweetが入ってくる場合があるため以前のtweetはこちらで濾し取る
      var diff = _.select(new_data, function(obj){ return !_.findWhere(before_data, {url: obj.url}); });
      if (diff === []) {
        return callback(null);
      }
    _(diff).each(function(val) {
      console.log('upload: ' + val.url);
    });

      s3.putObject({
          Bucket: json_bucket,
          Key: json_file,
          ACL: 'public-read',
          Body: new Buffer(
            JSON.stringify(before_data.concat(diff)), 'binary'
          ), // update running...
          ContentType: 'application/json'
      }, callback);
    });
}

// メインハンドラ
exports.handler = function(event, context) {
  console.log('Received event:' + Date.now());
  console.log(JSON.stringify(event, null, '  '));
  // Get the object from the event and show its content type
  // set timeoutで擬似cronを実現しています
  setTimeout(function() {
    // メイン処理
    s3.getObject({Bucket:target_bucket, Key:target_file},
      function(err,data) {
        if (err) {
          console.log('error getting object ' + target_file + ' from bucket ' + target_bucket +
               '. Make sure they exist and your bucket is in the same region as this function.');
          context.done('error','error getting file'+err);
        }
        var body = data.Body.toString("utf-8");
        main(body, function(last_id) {
          console.log('- change status...')
          change_status(last_id, function(err){
            if(err) {
              context.done(err,  "- change_status_error");
            } else {
              context.done(null, "- running...");
            }
          });
        });
    });

  }, interval);

};

function main(last_id, callback) {
  var client = new Twitter({
    consumer_key: '',
    consumer_secret: '',
    access_token_key: '',
    access_token_secret: ''
  });

  var screen_name = 'dekokun';

  var params = {
    screen_name: screen_name,
    trim_user: true,
    count: 10,
    include_rts: false
  };
  if (last_id.match(/[0-9]{16,}/)) {
    params.since_id = +last_id;
    console.log('since_id: ' + last_id);
  } else {
    console.log('data is invalid. since_id nothing. data: ' + last_id);
  }

  client.get('statuses/user_timeline', params, function(error, tweets, response){
    if (error) {
      console.log(error);
      throw new Error(error);
    }
    result = _(tweets)
    .filter(
      function(val) {return val.geo}
    )
    .map(
      function(val) {
        var media = val.entities.media;
        return {
          text: encodeURIComponent(val.text),
          geo: val.geo,
          url: 'https://twitter.com/' + screen_name + '/status/' + val.id_str,
          created_at: moment(val.created_at, 'ddd MMM DD HH:mm:ss ZZ YYYY').tz("Asia/Tokyo").format(),
          image_url: media ? media[0].media_url : null
        };
      }
    ).reverse();
    if (result.length > 0) {
      new_last_id = _(tweets).first().id_str;
    } else {
      new_last_id = last_id;
    }
    console.log('last id: ' + new_last_id);
    update_json(result, function(err) {
      if (err) {
        throw new Error(err);
      }
      callback(new_last_id);
    });
  });
}
