// ==UserScript==
// @name         5sing playlist
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include      https://raw.githubusercontent.com/HaoxinLuo/tampermonkey_scripts/master/5sing/blank.html
// @include      /^https?://5sing\.kugou\.com/[A-Za-z0-9]+/(fc|yc)/[0-9]+\.html/
// @require      http://code.jquery.com/jquery-3.2.1.slim.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      5sing.kugou.com
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    var artistPageRegex = /^https?:\/\/5sing\.kugou\.com\/[A-Za-z0-9]+\/(fc|yc)\/[0-9]+\.html/;
    var songPageRegex = /^https?:\/\/5sing\.kugou\.com\/(fc|yc)\/([0-9]+)\.html/;

    var scriptSetup = function () {
        if (GM_getValue("songs_added") === undefined) {
            GM_setValue("songs_added", 0);
        }
        console.log("finish script setup");
    };

    var artistPage = function() {
        var old_count = GM_getValue("songs_added");
        var songLinks = $("a").filter(function(i, e) {
            return songPageRegex.exec($(e).attr("href")) !== null;
        }).map(function(i, e) {
            GM_setValue("song_" + songPageRegex.exec($(e).attr("href"))[2], $(e).attr("href"));
            return $(e).attr("href");
        });

        GM_setValue("songs_added", old_count + songLinks.length);
        console.log({old_count:old_count, new_count:old_count + songLinks.length, li:songLinks});
    };

    var playlistPage = function() {
        var getSongInfo = (function(){
            var foobar = {};
            foobar.base64 = {
                _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
                decode: function(input){
                    var output = "";
                    var chr1, chr2, chr3;
                    var enc1, enc2, enc3, enc4;
                    var i = 0;
                    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
                    while (i < input.length) {
                        enc1 = foobar.base64._keyStr.indexOf(input.charAt(i++));
                        enc2 = foobar.base64._keyStr.indexOf(input.charAt(i++));
                        enc3 = foobar.base64._keyStr.indexOf(input.charAt(i++));
                        enc4 = foobar.base64._keyStr.indexOf(input.charAt(i++));
                        chr1 = (enc1 << 2) | (enc2 >> 4);
                        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                        chr3 = ((enc3 & 3) << 6) | enc4;
                        output = output + String.fromCharCode(chr1);
                        if (enc3 != 64) {
                            output = output + String.fromCharCode(chr2);
                        }
                        if (enc4 != 64) {
                            output = output + String.fromCharCode(chr3);
                        }
                    }
                    output = foobar.base64._utf8_decode(output);
                    return output;
                },
                _utf8_decode: function (input) {
                    var string = "";
                    var i = 0;
                    var c,c1,c2;
                    c = c1 = c2 = 0;
                    while ( i < input.length ) {
                        c = input.charCodeAt(i);
                        if (c < 128) {
                            string += String.fromCharCode(c);
                            i++;
                        } else if((c > 191) && (c < 224)) {
                            c2 = input.charCodeAt(i+1);
                            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                            i += 2;
                        } else {
                            c2 = input.charCodeAt(i+1);
                            c3 = input.charCodeAt(i+2);
                            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                            i += 3;
                        }
                    }
                    return string;
                }
            };
            return function(ticket) { return eval('('+foobar.base64.decode(ticket)+')'); };
        })();

        var setupPlayerPage = function() {
            var csp = $("<meta/>", {
                "http-equiv":"Content-Security-Policy",
                "content":"media-src static.5sing.kugou.com"
            });
            var list = $("<ol/>", {id: "playlist"});
            var controls = $("<audio/>", {
                id: "controls",
                controls: "",
                autoplay: "true"
            });
            var player = $("<source/>", {
                id: "player",
                src: "",
                type: "audio/mpeg"
            });
            controls.append(player);
            controls.append("Pick a song to start");
            $("body").append(list);
            $("body").append(controls);
            $("html").append("<head/>");
            $("head").append(csp);

            GM_addStyle("ol#playlist { display: inline-block; width: 500px; }");
            GM_addStyle(".songName { width: 70%; }");
            GM_addStyle(".songName, .artistName { display: inline-block; }");
            GM_addStyle("audio { display: inline-block; }");
        };

        var clickedSong = function(e) {
            e.preventDefault();
            $("#player").attr("src", $(e.target).closest("li").attr("data-href"));
        };

        var addSong = function(res) {
            if (res.status === 200){
                var htmlContent = $.parseHTML(res.response, null, true);
                var ticket = eval("{"+$(htmlContent).filter("#songinfo_script").html()+"}").ticket;
                var songInfo = getSongInfo(ticket);
                var listElement = $("<li/>", {
                    id: songInfo.songId,
                    "data-href": songInfo.file
                });
                var songName = $("<div/>", {
                    class: "songName",
                    html: songInfo.songName
                });
                var artistName = $("<div/>", {
                    class: "artistName",
                    html: songInfo.singer
                });

                $(listElement).on("click", clickedSong);

                listElement.append(songName);
                listElement.append(artistName);
                $("#playlist").append(listElement);
            }
        };

        var addNewSongs = function(name, old_value, new_value, remote) {
            if (new_value > 0 && remote) {
                var keys = GM_listValues();
                for (var i = 0; i < keys.length; i++) {
                    var key = keys[i];
                    if (/^song_[0-9]+/.exec(key) === null) {
                        continue;
                    }
                    GM_xmlhttpRequest({method: "GET",
                                       url: GM_getValue(key),
                                       onload: addSong
                                      });
                    GM_deleteValue(key);
                }
                GM_setValue("songs_added", 0);
            }
        };

        setupPlayerPage();
        GM_addValueChangeListener("songs_added", addNewSongs);
    };

    scriptSetup();
    if (artistPageRegex.exec(location.href) !== null) {
        console.log("on artist page");
        artistPage();
    } else {
        console.log("on playlist page");
        playlistPage();
    }
})();
