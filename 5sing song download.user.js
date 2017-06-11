// ==UserScript==
// @name         5sing song download
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @include      /^https?://5sing\.kugou\.com/(fc|yc)/[0123456789]+\.html
// @grant        GM_openInTab
// @grant        window.close
// @run-at       document-body
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
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
        }};
    var songObj = eval('('+foobar.base64.decode(globals.ticket)+')');
    /*
    GM_openInTab(songObj.file);
    console.log(songObj.file);
    window.close();
    */
    //location.href = songObj.file;
    GM_openInTab(songObj.file);
})();