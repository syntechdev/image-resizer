'use strict';

var stream, util, env, Twit, t, _;

stream  = require('stream');
util    = require('util');
env     = require('../../config/environment_vars');
Twit    = require('twit');
_       = require('lodash');

/* jshint camelcase:false */
try {
  t = new Twit({
    consumer_key:         env.TWITTER_CONSUMER_KEY,
    consumer_secret:      env.TWITTER_CONSUMER_SECRET,
    access_token:         env.TWITTER_ACCESS_TOKEN,
    access_token_secret:  env.TWITTER_ACCESS_TOKEN_SECRET
  });
} catch(e){

}


function Twitter(image){
  /* jshint validthis:true */
  if (!(this instanceof Twitter)){
    return new Twitter(image);
  }
  stream.Readable.call(this, { objectMode : true });
  this.image = image;
  this.ended = false;
  this.key = 'twitter';

  // set the expiry value to the shorter value
  this.image.expiry = env.IMAGE_EXPIRY_SHORT;
}

util.inherits(Twitter, stream.Readable);

Twitter.prototype._read = function(){
  var _this = this,
      profileId, queryString;

  if ( this.ended ){ return; }

  // pass through if there is an error on the image object
  if (this.image.isError()){
    this.ended = true;
    this.push(this.image);
    return this.push(null);
  }

  // pass through the stream with an error if the twit library didnt start
  if (!t){
    this.image.error = new Error('Need valid twitter credentials');
    this.push(this.image);
    return this.push(null);
  }

  var endStream = function(){
    _this.ended = true;
    _this.push(_this.image);
    _this.push(null);
  };

  this.image.log.time(this.key);

  profileId = this.image.image.split('.')[0];

  if (_.isNaN(profileId * 1)){
    queryString = {screen_name: profileId};
  } else {
    queryString = {user_id: profileId};
  }

  t.get('users/show', queryString, function(err, data){
    if (err){
      _this.image.error = new Error(err);
      endStream();
    }
    else {
      /* jshint camelcase:false */
      var imageUrl = data.profile_image_url
        .replace('_normal', '')
        .replace('_bigger', '')
        .replace('_mini', '');
      require('./util/fetch')(_this, imageUrl);
    }
  });

};


module.exports = Twitter;
