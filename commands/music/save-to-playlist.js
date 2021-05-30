const { Command } = require('discord.js-commando');
const db = require('quick.db');
const Youtube = require('simple-youtube-api');
const { youtubeAPI } = require('../../config.json');
const youtube = new Youtube(youtubeAPI);

module.exports = class SaveToPlaylistCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'save-to-playlist',
      aliases: ['stp', 'save-song', 'add-to-playlist', 'add-song'],
      group: 'music',
      memberName: 'save-to-playlist',
      guildOnly: true,
      description: 'Save a song or a playlist to a saved playlist',
      args: [
        {
          key: 'playlist',
          prompt: 'What is the playlist you would like to save to?',
          type: 'string'
        },
        {
          key: 'url',
          prompt:
            'What url would you like to save to playlist? It can also be a playlist url',
          type: 'string',
          validate: function validateURL(url) {
            return (
              url.match(
                /^(?!.*\?.*\bv=)https:\/\/www\.youtube\.com\/.*\?.*\blist=.*$/
              ) ||
              url.match(
                /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/
              ) ||
              url.match(
                /^(?!.*\?.*\bv=)https:\/\/www\.youtube\.com\/.*\?.*\blist=.*$/
              )
            );
          }
          // default: '' // @TODO support saving currently playing song
        }
      ]
    });
  }

  async run(message, { playlist, url }) {
    // check if user has playlists or user is in the db
    const dbUserFetch = db.get(message.member.id);
    if (!dbUserFetch) {
      message.channel.send('You have zero saved playlists!', {
        reply: { messageReference: message.id }
      });
      return;
    }
    const savedPlaylistsClone = dbUserFetch.savedPlaylists;
    if (savedPlaylistsClone.length == 0) {
      message.channel.send('You have zero saved playlists!', {
        reply: { messageReference: message.id }
      });
      return;
    }
    let found = false;
    let location;
    for (let i = 0; i < savedPlaylistsClone.length; i++) {
      if (savedPlaylistsClone[i].name == playlist) {
        found = true;
        location = i;
        break;
      }
    }
    if (found) {
      let urlsArrayClone = savedPlaylistsClone[location].urls;
      const processedURL = await SaveToPlaylistCommand.processURL(url, message);
      if (!processedURL) return;
      if (Array.isArray(processedURL)) {
        urlsArrayClone = urlsArrayClone.concat(processedURL);
        savedPlaylistsClone[location].urls = urlsArrayClone;
        message.channel.send(
          'The playlist you provided was successfully saved!',
          {
            reply: { messageReference: message.id }
          }
        );
      } else {
        urlsArrayClone.push(processedURL);
        savedPlaylistsClone[location].urls = urlsArrayClone;
        message.channel.send(
          `I added **${
            savedPlaylistsClone[location].urls[
              savedPlaylistsClone[location].urls.length - 1
            ].title
          }** to **${playlist}**`,
          { reply: { messageReference: message.id } }
        );
      }
      db.set(message.member.id, { savedPlaylists: savedPlaylistsClone });
    } else {
      message.channel.send(`You have no playlist named ${playlist}`, {
        reply: { messageReference: message.id }
      });
      return;
    }
  }

  static async processURL(url, message) {
    if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
      const playlist = await youtube.getPlaylist(url).catch(function() {
        message.channel.send(
          ':x: Playlist is either private or it does not exist!',
          {
            reply: { messageReference: message.id }
          }
        );
      });
      if (!playlist) {
        return false;
      }
      const videosArr = await playlist.getVideos().catch(function() {
        message.channel.send(
          ':x: There was a problem getting one of the videos in the playlist!',
          { reply: { messageReference: message.id } }
        );
        return;
      });
      let urlsArr = [];
      for (let i = 0; i < videosArr.length; i++) {
        if (videosArr[i].raw.status.privacyStatus == 'private') {
          continue;
        } else {
          try {
            const video = await videosArr[i].fetch();
            urlsArr.push(
              SaveToPlaylistCommand.constructSongObj(video, message.member.user)
            );
          } catch (err) {
            return console.error(err);
          }
        }
      }
      return urlsArr;
    }
    url = url
      .replace(/(>|<)/gi, '')
      .split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    const id = url[2].split(/[^0-9a-z_\-]/i)[0];
    const video = await youtube.getVideoByID(id).catch(function() {
      message.channel.send(
        ':x: There was a problem getting the video you provided!',
        {
          reply: { messageReference: message.id }
        }
      );
      return;
    });
    if (video.raw.snippet.liveBroadcastContent === 'live') {
      message.channel.send("I don't support live streams!", {
        reply: { messageReference: message.id }
      });
      return false;
    }
    return SaveToPlaylistCommand.constructSongObj(video, message.member.user);
  }
  static constructSongObj(video, user) {
    let duration = this.formatDuration(video.duration);
    return {
      url: `https://www.youtube.com/watch?v=${video.raw.id}`,
      title: video.title,
      rawDuration: video.duration,
      duration,
      thumbnail: video.thumbnails.high.url,
      memberDisplayName: user.username,
      memberAvatar: user.avatarURL('webp', false, 16)
    };
  }
  // prettier-ignore
  static formatDuration(durationObj) {
    const duration = `${durationObj.hours ? (durationObj.hours + ':') : ''}${
      durationObj.minutes ? durationObj.minutes : '00'
    }:${
      (durationObj.seconds < 10)
        ? ('0' + durationObj.seconds)
        : (durationObj.seconds
        ? durationObj.seconds
        : '00')
    }`;
    return duration;
  }
};
